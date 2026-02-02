'use server'

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { razorpay, CLERK_TO_RAZORPAY_PLAN_MAP, ClerkPlanKey } from '@/lib/razorpay/config';
import { getClerkPlanByKey } from '../clerk/plan';
import { CreateSupabaseServiceClient } from '../supabase';
import crypto from 'crypto';



// Create a Razorpay order based on Clerk plan
export async function createRazorpayOrderForClerkPlan(planKey: string) {
    try {
      const { userId } = await auth();
      const user = await currentUser();
      
      if (!userId || !user) throw new Error('Unauthorized');
  
      // 1. Fetch Plan Details from Clerk (Single Source of Truth)
      const clerkPlan = await getClerkPlanByKey(planKey);
      
      if (!clerkPlan) {
          throw new Error(`Plan ${planKey} not found in Clerk`);
      }
  
      // 2. Calculate Amount
      // Clerk usually stores prices in cents/smallest unit. 
      // Razorpay also expects amount in smallest unit (paise).
      // Ensure conversion rates if Clerk is USD and Razorpay is INR.
      // For now, assuming 1:1 or handled conversion:
      const amount = clerkPlan.monthlyPrice; 
  
      // 3. Create Razorpay Order
      const order = await razorpay.orders.create({
        amount: amount, 
        currency: clerkPlan.currency || 'INR',
        receipt: `recipt_${userId}_${Date.now()}`,
        notes: {
          userId: userId,
          userEmail: user.emailAddresses[0]?.emailAddress,
          planKey: planKey,
          clerkPlanId: clerkPlan.id
        }
      });
  
      return {
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          planName: clerkPlan.name,
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      };
  
    } catch (error) {
      console.error('Razorpay Order Creation Failed:', error);
      return { success: false, error: 'Failed to create order' };
    }
  }

// Verify Razorpay payment signature
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    const secret = process.env.RAZORPAY_SECRET_KEY!;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

// After payment success, sync with Clerk
export async function activateClerkSubscription(
  clerkPlanKey: string,
  razorpayData: {
    paymentId: string;
    orderId: string;
    signature: string;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Verify payment signature
    const isValid = await verifyRazorpayPayment(
      razorpayData.orderId,
      razorpayData.paymentId,
      razorpayData.signature
    );

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Get the plan details
    const clerkPlan = await getClerkPlanByKey(clerkPlanKey);
    if (!clerkPlan) {
      throw new Error('Plan not found');
    }

    const client = await clerkClient();

    // Update user's public metadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        plan: clerkPlanKey,
        planId: clerkPlan.id,
        subscriptionStatus: 'active',
        razorpayPaymentId: razorpayData.paymentId,
        razorpayOrderId: razorpayData.orderId,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ).toISOString(),
      },
    });

    // Store in Supabase
    const supabase = CreateSupabaseServiceClient();
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_key: clerkPlanKey,
      plan_id: clerkPlan.id,
      plan_name: clerkPlan.name,
      status: 'active',
      razorpay_payment_id: razorpayData.paymentId,
      razorpay_order_id: razorpayData.orderId,
      activated_at: new Date().toISOString(),
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    }, {
      onConflict: 'user_id',
    });

    return { success: true };
  } catch (error) {
    console.error('Error activating subscription:', error);
    throw error;
  }
}

// Get current user's subscription
export async function getCurrentSubscription() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as any;

    return {
      planKey: metadata.plan || 'basic',
      planId: metadata.planId,
      status: metadata.subscriptionStatus || 'inactive',
      startDate: metadata.subscriptionStartDate,
      endDate: metadata.subscriptionEndDate,
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}
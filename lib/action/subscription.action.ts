'use server'

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { razorpay } from '@/lib/razorpay/config';
import { getClerkPlanByKey } from '../clerk/plan';
import { CreateSupabaseClient, CreateSupabaseServiceClient } from '../supabase';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import plans from 'razorpay/dist/types/plans';



// Create a Razorpay order based on Clerk plan
export async function createRazorpayOrderForClerkPlan(planKey: string) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      throw new Error('User not authenticated');
    }

    // Get Clerk plan details
    const clerkPlan = await getClerkPlanByKey(planKey);
    
    if (!clerkPlan) {
      throw new Error(`Plan ${planKey} not found in Clerk`);
    }

    // Free plan doesn't need payment
    if (planKey === 'basic') {
      throw new Error('Free plan does not require payment');
    }

    console.log('Creating Razorpay order:', {
      planKey,
      planName: clerkPlan.name,
      amountINR: clerkPlan.monthlyPriceINR,
    });

    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = userId.slice(-10); // Last 10 chars of user ID
    const receipt = `${planKey}_${userIdShort}_${timestamp}`; // Max ~35 chars

    // Create Razorpay order with INR amount in paise
    const order = await razorpay.orders.create({
      amount: clerkPlan.monthlyPriceINR, // Amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        userId: userId,
        userEmail: user.emailAddresses[0]?.emailAddress || '',
        planKey: planKey,
        clerkPlanId: clerkPlan.id,
        planName: clerkPlan.name,
      },
    });

    console.log('Razorpay order created successfully:', order.id);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: clerkPlan.name,
      planKey: planKey,
    };

  } catch (error: any) {
    console.error('Razorpay Order Creation Failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create order' 
    };
  }
}

// Verify Razorpay payment signature
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET!;
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

    let paymentMethodLabel = 'Online Payment';
    let cardLast4 = '••••';

    try {
        const payment = await razorpay.payments.fetch(razorpayData.paymentId);
        
        if (payment.method === 'card') {
            // For cards, Razorpay returns specific card info
            const cardInfo = payment.card; // Access the card object
            // Note: Typescript might complain if types aren't perfect, cast as any if needed
            const network = (cardInfo as any)?.network || 'Card';
            const last4 = (cardInfo as any)?.last4 || '••••';
            
            paymentMethodLabel = `${network} Card`; // e.g. "Visa Card"
            cardLast4 = last4;
        } else if (payment.method === 'upi') {
            paymentMethodLabel = `UPI (${payment.vpa})`;
        } else if (payment.method === 'netbanking') {
            paymentMethodLabel = `Netbanking (${payment.bank})`;
        } else {
            paymentMethodLabel = payment.method; // e.g. 'wallet'
        }
    } catch (err) {
        console.error("Failed to fetch Razorpay payment details", err);
        // Continue activation even if detail fetch fails
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
        paymentMethod: paymentMethodLabel,
        cardLast4: cardLast4
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

    console.log('Subscription activated successfully for user:', userId);

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

export async function cancelSubscription() {
    try {
        const {userId} = await auth();
        if (!userId) throw new Error('Unauthorized')
        const client = await clerkClient()

        await client.users.updateUser(userId, {
            publicMetadata: {
                plan: 'basic',
                subscriptionStatus: 'cancel',
                subscriptionEndDate: new Date().toISOString()
            }
        })

        const supabase = CreateSupabaseClient()
        await supabase.from('subscriptions')
        .update({status: 'canceled', plan_key: 'basic'})
        .eq('user_id', userId)


        revalidatePath('/');

        return { success: true } 
    } catch (error) {
        console.error('Cancellation failed:', error);
        return { success: false, error: 'failed to cancel Subscription'}
    }
}
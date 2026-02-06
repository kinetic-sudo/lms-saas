'use server'

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { razorpay } from '@/lib/razorpay/config';
import { getClerkPlanByKey } from '../clerk/plan';
import { CreateSupabaseClient, CreateSupabaseServiceClient } from '../supabase';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import plans from 'razorpay/dist/types/plans';



// Create a Razorpay order based on Clerk plan
export async function createRazorpayOrderForClerkPlan(
  planKey: string,
  billingCycle: 'monthly' | 'annual' = 'monthly'
) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      throw new Error('User not authenticated');
    }

    const clerkPlan = await getClerkPlanByKey(planKey);
    
    if (!clerkPlan) {
      throw new Error(`Plan ${planKey} not found in Clerk`);
    }

    if (planKey === 'basic') {
      throw new Error('Free plan does not require payment');
    }

    // Calculate amount based on billing cycle
    // Convert annualPrice (USD cents) to INR paise using conversion rate 91
    const amount = billingCycle === 'annual' 
      ? Math.round(clerkPlan.annualPrice * 91)
      : clerkPlan.monthlyPriceINR;

    console.log('Creating Razorpay order:', {
      planKey,
      billingCycle,
      planName: clerkPlan.name,
      amountINR: amount,
    });

    const timestamp = Date.now().toString().slice(-8);
    const userIdShort = userId.slice(-10);
    const receipt = `${planKey}_${billingCycle}_${userIdShort}_${timestamp}`;

    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: receipt,
      notes: {
        userId: userId,
        userEmail: user.emailAddresses[0]?.emailAddress || '',
        planKey: planKey,
        billingCycle: billingCycle,
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
      billingCycle: billingCycle,
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
  billingCycle: 'monthly' | 'annual',
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

    // Verify signature (skip for webhooks)
    if (razorpayData.signature) {
      const isValid = await verifyRazorpayPayment(
        razorpayData.orderId,
        razorpayData.paymentId,
        razorpayData.signature
      );

      if (!isValid) {
        throw new Error('Invalid payment signature');
      }
    }

    const clerkPlan = await getClerkPlanByKey(clerkPlanKey);
    if (!clerkPlan) {
      throw new Error('Plan not found');
    };


    let paymentMethodLabel = 'Online Payment';
    let cardLast4 = '••••';
    let paymentAmount = clerkPlan.monthlyPriceINR;

    // Fetch payment details from Razorpay
    try {
      const payment = await razorpay.payments.fetch(razorpayData.paymentId);
      paymentAmount = payment.amount;
      
      if (payment.method === 'card') {
        const cardInfo = payment.card;
        const network = (cardInfo as any)?.network || 'Card';
        const last4 = (cardInfo as any)?.last4 || '••••';
        paymentMethodLabel = `${network} Card`;
        cardLast4 = last4;
      } else if (payment.method === 'upi') {
        paymentMethodLabel = `UPI (${payment.vpa})`;
      } else if (payment.method === 'netbanking') {
        paymentMethodLabel = `Netbanking (${payment.bank})`;
      } else if (payment.method === 'wallet') {
        paymentMethodLabel = `Wallet (${payment.wallet})`;
      } else {
        paymentMethodLabel = payment.method;
      }
    } catch (err) {
      console.error("Failed to fetch payment details", err);
    }

    const daysToAdd = billingCycle === 'annual' ? 365 : 30;
    const subscriptionEndDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    
    const client = await clerkClient();

    // Update Clerk metadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        plan: clerkPlanKey,
        planId: clerkPlan.id,
        subscriptionStatus: 'active',
        billingCycle: billingCycle,
        razorpayPaymentId: razorpayData.paymentId,
        razorpayOrderId: razorpayData.orderId,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        paymentMethod: paymentMethodLabel,
        cardLast4: cardLast4,
        lastPaymentAmount: paymentAmount,
      },
    });

    const supabase = CreateSupabaseServiceClient();
    
    // Update/Create subscription record
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_key: clerkPlanKey,
      plan_id: clerkPlan.id,
      plan_name: clerkPlan.name,
      status: 'active',
      razorpay_payment_id: razorpayData.paymentId,
      razorpay_order_id: razorpayData.orderId,
      payment_method: paymentMethodLabel,
      card_last4: cardLast4,
      amount_paid: paymentAmount,
      currency: 'INR',
      activated_at: subscriptionEndDate.toISOString(),
      expires_at: subscriptionEndDate.toISOString(),
      next_billing_date: subscriptionEndDate.toISOString(),
      auto_renew: false, // Manual renewal for now
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'user_id' 
    });

    // Log successful payment
    await supabase.from('payment_logs').insert({
      user_id: userId,
      payment_id: razorpayData.paymentId,
      order_id: razorpayData.orderId,
      status: 'success',
      amount: paymentAmount,
      currency: 'INR',
      plan_key: clerkPlanKey,
      plan_name: clerkPlan.name,
      payment_method: paymentMethodLabel,
      card_last4: cardLast4,
      metadata: {
        activated_via: razorpayData.signature ? 'frontend' : 'webhook',
      }
    });

    console.log('✅ Subscription activated successfully for user:', userId);
    console.log('📊 Payment logged:', razorpayData.paymentId);

    return { success: true };
  } catch (error: any) {
    console.error('❌ Error activating subscription:', error);
    
    // Log failed activation
    try {
      const supabase = CreateSupabaseServiceClient();
      const { userId } = await auth();
      
      if (userId) {
        await supabase.from('payment_logs').insert({
          user_id: userId,
          payment_id: razorpayData.paymentId,
          order_id: razorpayData.orderId,
          status: 'failed',
          amount: 0,
          error_description: error.message,
          metadata: { error_stack: error.stack }
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    throw error;
  }
}

// lib/action/subscription.action.ts - Add new function
export async function checkAndUpdateExpiredSubscriptions() {
  try {
    const supabase = CreateSupabaseServiceClient();
    
    // Find expired subscriptions
    const { data: expiredSubs, error } = await supabase
      .from('subscriptions')
      .select('user_id, plan_key')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    if (expiredSubs && expiredSubs.length > 0) {
      console.log('Found', expiredSubs.length, 'expired subscriptions');

      for (const sub of expiredSubs) {
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString() 
          })
          .eq('user_id', sub.user_id);

        // Update Clerk metadata
        const client = await clerkClient();
        await client.users.updateUser(sub.user_id, {
          publicMetadata: {
            plan: 'basic',
            subscriptionStatus: 'expired',
          },
        });

        console.log('Expired subscription for user:', sub.user_id);
      }
    }

    return { success: true, expiredCount: expiredSubs?.length || 0 };
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
    return { success: false, error };
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
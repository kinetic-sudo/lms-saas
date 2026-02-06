// app/api/razorpay/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { activateClerkSubscription } from '@/lib/action/subscription.action';
import { CreateSupabaseServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    console.log('Razorpay Webhook Event:', event.event);

    // Handle different events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentSuccess(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionRenewal(event.payload.subscription.entity);
        break;
      
      default:
        console.log('Unhandled event:', event.event);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(payment: any) {
  try {
    const notes = payment.notes;
    const userId = notes.userId;
    const planKey = notes.planKey;

    if (!userId || !planKey) {
      console.error('Missing userId or planKey in payment notes');
      return;
    }

    console.log('Processing payment success for user:', userId);

    // Activate subscription (this will be idempotent)
    await activateClerkSubscription(planKey, {
      paymentId: payment.id,
      orderId: payment.order_id,
      signature: '', // Not needed for webhook
    });

    console.log('✅ Subscription activated via webhook');
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  const supabase = CreateSupabaseServiceClient();
  
  // Log failed payment
  await supabase.from('payment_logs').insert({
    user_id: payment.notes.userId,
    payment_id: payment.id,
    order_id: payment.order_id,
    status: 'failed',
    amount: payment.amount,
    error_description: payment.error_description,
    created_at: new Date().toISOString(),
  });

  console.log('❌ Payment failed:', payment.id);
}

async function handleSubscriptionRenewal(subscription: any) {
  // Handle recurring payments (future feature)
  console.log('Subscription renewed:', subscription.id);
}
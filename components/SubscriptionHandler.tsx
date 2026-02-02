'use client'

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createRazorpayOrderForClerkPlan, activateClerkSubscription } from '@/lib/action/subscription.action';
import Script from 'next/script';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionHandler() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const handleSubscribeClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Find the button (handling click on inner elements like spans)
      const button = target.closest('.razorpay-btn') as HTMLButtonElement;
      if (!button) return;

      const planKey = button.getAttribute('data-plan');
      if (!planKey || planKey === 'basic') return;

      event.preventDefault();
      event.stopPropagation();

      // UI Feedback
      const originalText = button.innerText;
      button.innerText = "Processing...";
      button.disabled = true;

      try {
        await handleRazorpayPayment(planKey);
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Failed to initiate payment.');
      } finally {
        // Reset button state
        button.innerText = originalText;
        button.disabled = false;
      }
    };

    document.addEventListener('click', handleSubscribeClick, true);
    return () => document.removeEventListener('click', handleSubscribeClick, true);
  }, [user]);

  const handleRazorpayPayment = async (planKey: string) => {
    // 1. Create Order via Server Action
    const order = await createRazorpayOrderForClerkPlan(planKey);

    if (!order.success) {
      throw new Error(order.error || 'Failed to create order');
    }

    // 2. Open Razorpay Gateway
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: order.currency,
      name: 'SkillForge',
      description: `Subscribe to ${order.planName}`,
      order_id: order.orderId,
      prefill: {
        name: user?.fullName || '',
        email: user?.emailAddresses[0]?.emailAddress || '',
      },
      theme: { color: '#111111' },
      handler: async function (response: any) {
        try {
          // 3. Verify & Activate via Server Action
          const result = await activateClerkSubscription(planKey, {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          });

          if (result.success) {
            toast.success("Subscription Activated!");
            // REFRESH DATA to show the 'Tick Mark' immediately
            router.refresh(); 
            // Optional: Redirect to profile
            // router.push('/my-journey');
          } else {
            toast.error('Payment verification failed.');
          }
        } catch (error) {
          console.error('Verification error:', error);
          toast.error('Activation failed. Please contact support.');
        }
      },
      modal: {
        ondismiss: function() {
          toast.info("Payment cancelled");
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />;
}
// components/SubscriptionHandler.tsx
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
      const button = target.closest('.razorpay-btn') as HTMLButtonElement;
      
      if (!button) return;

      const planKey = button.getAttribute('data-plan');
      const billingCycle = button.getAttribute('data-billing') as 'monthly' | 'annual' || 'monthly';
      
      if (!planKey || planKey === 'basic') return;

      event.preventDefault();
      event.stopPropagation();

      const originalText = button.innerText;
      button.innerText = "Processing...";
      button.disabled = true;

      try {
        await handleRazorpayPayment(planKey, billingCycle);
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Failed to initiate payment.');
      } finally {
        button.innerText = originalText;
        button.disabled = false;
      }
    };

    document.addEventListener('click', handleSubscribeClick, true);
    return () => document.removeEventListener('click', handleSubscribeClick, true);
  }, [user, router]);

  const handleRazorpayPayment = async (
    planKey: string, 
    billingCycle: 'monthly' | 'annual'
  ) => {
    // Create order with billing cycle
    const order = await createRazorpayOrderForClerkPlan(planKey, billingCycle);

    if (!order.success) {
      throw new Error(order.error || 'Failed to create order');
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: order.currency,
      name: 'SkillForge',
      description: `${order.planName} - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
      order_id: order.orderId,
      prefill: {
        name: user?.fullName || '',
        email: user?.emailAddresses[0]?.emailAddress || '',
      },
      theme: { color: '#111111' },
      handler: async function (response: any) {
        try {
          toast.loading('Verifying payment...');

          const result = await activateClerkSubscription(
            planKey, 
            billingCycle,
            {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            }
          );

          toast.dismiss();

          if (result.success) {
            toast.success('🎉 Subscription Activated!', {
              description: `You're now on the ${order.planName} ${billingCycle} plan`,
              duration: 5000,
            });
            
            setTimeout(() => {
              router.refresh();
            }, 1000);
          } else {
            toast.error('Payment verification failed.');
          }
        } catch (error) {
          toast.dismiss();
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
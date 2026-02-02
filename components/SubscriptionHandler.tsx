'use client'

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createRazorpayOrderForClerkPlan } from '@/lib/action/subscription.action';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionHandler() {
  const { user } = useUser();

  useEffect(() => {
    // Intercept all clicks on subscribe buttons
    const handleSubscribeClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if clicked element is a subscribe button
      const button = target.closest('.cl-subscribe-btn');
      if (!button) return;

      // Get the plan card
      const planCard = button.closest('.cl-plan-card');
      if (!planCard) return;

      // Extract plan key from Clerk's data attributes
      const planKey = planCard.getAttribute('data-plan-key') || 
                      planCard.querySelector('[data-plan-key]')?.getAttribute('data-plan-key');

      if (!planKey) {
        console.error('Could not find plan key');
        return;
      }

      // Don't intercept free plan
      if (planKey === 'basic') {
        return; // Let Clerk handle it
      }

      // Prevent Clerk's default behavior
      event.preventDefault();
      event.stopPropagation();

      // Handle Razorpay payment
      await handleRazorpayPayment(planKey);
    };

    // Alternative: Intercept by button text
    const handleButtonClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button');
      
      if (!button) return;
      
      const buttonText = button.textContent?.toLowerCase() || '';
      
      // Check if it's a subscribe/upgrade button
      if (!buttonText.includes('subscribe') && 
          !buttonText.includes('upgrade') && 
          !buttonText.includes('select')) {
        return;
      }

      // Find parent plan card
      const planCard = button.closest('.cl-plan-card');
      if (!planCard) return;

      // Get plan name from the card
      const planTitle = planCard.querySelector('.text-2xl')?.textContent?.toLowerCase() || '';
      
      let planKey = 'basic';
      if (planTitle.includes('intermediate')) {
        planKey = 'intermediate';
      } else if (planTitle.includes('pro')) {
        planKey = 'pro';
      }

      // Don't intercept free plan
      if (planKey === 'basic') return;

      // Prevent default
      event.preventDefault();
      event.stopPropagation();

      await handleRazorpayPayment(planKey);
    };

    // Add listeners
    document.addEventListener('click', handleSubscribeClick, true);
    document.addEventListener('click', handleButtonClick, true);

    return () => {
      document.removeEventListener('click', handleSubscribeClick, true);
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, []);

  const handleRazorpayPayment = async (planKey: string) => {
    try {
      // Create Razorpay order
      const order = await createRazorpayOrderForClerkPlan(planKey);

      if (!order.success) {
        alert('Failed to create order. Please try again.');
        return;
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillForge',
        description: `${order.planName} Subscription`,
        order_id: order.orderId,
        prefill: {
          name: user?.fullName || '',
          email: user?.emailAddresses[0].emailAddress || '',
        },
        theme: {
          color: '#111111',
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planKey: planKey,
              }),
            });

            if (verifyResponse.ok) {
              alert('Subscription activated successfully! 🎉');
              window.location.reload();
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Something went wrong. Please contact support.');
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  return <Script src="https://checkout.razorpay.com/v1/checkout.js" />;
}
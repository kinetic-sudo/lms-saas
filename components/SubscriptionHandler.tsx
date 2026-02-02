// components/SubscriptionHandler.tsx
'use client'

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionHandler() {
  const { user } = useUser();

  useEffect(() => {
    const handleButtonClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button.razorpay-btn') as HTMLButtonElement;
      
      if (!button) return;

      const planKey = button.getAttribute('data-plan');
      
      if (!planKey || planKey === 'basic') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // Disable button
      button.disabled = true;
      button.textContent = 'Processing...';

      try {
        await handleRazorpayPayment(planKey);
      } catch (error) {
        console.error('Payment error:', error);
        alert('Failed to initiate payment. Please try again.');
      } finally {
        button.disabled = false;
        button.textContent = 'Switch to this plan';
      }
    };

    document.addEventListener('click', handleButtonClick, true);

    return () => {
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, [user]);

  const handleRazorpayPayment = async (planKey: string) => {
    try {
      console.log('Creating Razorpay order for plan:', planKey);
      
      // Create order via API route
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });

      const orderData = await orderResponse.json();

      console.log('Order response:', orderData);

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Check if Razorpay SDK is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SkillForge',
        description: `${orderData.planName} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.fullName || '',
          email: user?.emailAddresses[0]?.emailAddress || '',
        },
        theme: {
          color: '#111111',
        },
        handler: async function (response: any) {
          try {
            console.log('Payment successful:', response);
            
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

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              alert('Subscription activated successfully! 🎉');
              window.location.href = '/my-journey';
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Something went wrong. Please contact support.');
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed by user');
          }
        }
      };

      console.log('Opening Razorpay checkout...');

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

    } catch (error: any) {
      console.error('Payment initialization error:', error);
      throw error;
    }
  };

  return <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />;
}
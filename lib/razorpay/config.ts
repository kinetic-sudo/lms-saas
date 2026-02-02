import Razorpay from 'razorpay'

export const razorpay = typeof window === 'undefined' 
  ? new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    })
  : null as any;

export type ClerkPlanKey = 'basic' | 'intermediate' | 'pro';
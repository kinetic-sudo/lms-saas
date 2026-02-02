import Razorpay from 'razorpay'

export const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
})


// Map Clerk plan keys to Razorpay plan IDs
export const CLERK_TO_RAZORPAY_PLAN_MAP = {
    'basic': null, 
    'intermediate': process.env.RAZORPAY_INTERMEDIATE_PLAN_ID!,
    'pro': process.env.RAZORPAY_PRO_PLAN_ID!,
} as const;

export type ClerkPlanKey = keyof typeof CLERK_TO_RAZORPAY_PLAN_MAP
'use server'

export interface ClerkPlan {
  id: string;
  name: string;
  key: string;
  monthlyPrice: number; // in cents (USD) from Clerk
  monthlyPriceINR: number; // converted to paise (INR)
  annualPrice: number;
  currency: string;
  features: string[];
  metadata?: Record<string, any>;
}

// USD to INR conversion rate (update periodically)
const USD_TO_INR = 91;

// Define your plans based on Clerk Dashboard configuration
// Prices in cents (USD) matching Clerk exactly
const SUBSCRIPTION_PLANS: ClerkPlan[] = [
  {
    id: 'plan_basic',
    name: 'Basic Plan',
    key: 'basic',
    monthlyPrice: 0, // $0 in cents
    monthlyPriceINR: 0, // ₹0 in paise
    annualPrice: 0,
    currency: 'INR',
    features: [
      '10 Conversation/month',
      '3 Active Companions',
      'Basic Session Recaps',
    ],
  },
  {
    id: 'plan_intermediate',
    name: 'Intermediate Learner',
    key: 'intermediate',
    monthlyPrice: 1500, // $15 in cents (from Clerk)
    monthlyPriceINR: Math.round(1500 * USD_TO_INR), // ₹1245 in paise
    annualPrice: 18000, // $180 in cents
    currency: 'INR',
    features: [
      'Everything in Free',
      'Unlimited Conversations',
      '10 Active Companion',
      'Save Conversation History',
      'Inline Quizzes & Recaps',
      'Monthly Progress Report',
    ],
  },
  {
    id: 'plan_pro',
    name: 'Pro Companion',
    key: 'pro',
    monthlyPrice: 4000, // $40 in cents (from Clerk)
    monthlyPriceINR: Math.round(4000 * USD_TO_INR), // ₹3320 in paise
    annualPrice: 48000, // $480 in cents
    currency: 'INR',
    features: [
      'Everything in Core',
      'Unlimited Companions',
      'Early Access to New Features',
      'Daily Learning Reminders',
      'Full Performance Dashboard',
      'Priority Support',
    ],
  },
];

export async function getClerkSubscriptionPlans(): Promise<ClerkPlan[]> {
  return SUBSCRIPTION_PLANS;
}

export async function getClerkPlanByKey(planKey: string): Promise<ClerkPlan | null> {
  try {
    const plans = await getClerkSubscriptionPlans();
    const plan = plans.find(p => p.key === planKey);
    
    if (!plan) {
      console.error(`Plan with key "${planKey}" not found. Available plans:`, plans.map(p => p.key));
      return null;
    }
    
    return plan;
  } catch (error) {
    console.error('Error fetching Clerk plan by key:', error);
    return null;
  }
}
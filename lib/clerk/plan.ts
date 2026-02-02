'use server'

import { clerkClient } from '@clerk/nextjs/server';

export interface ClerkPlan {
  id: string;
  name: string;
  key: string;
  monthlyPrice: number; // in cents (USD)
  annualPrice: number;
  currency: string;
  features: string[];
  metadata?: Record<string, any>;
}



export async function getClerkSubscriptionPlans(): Promise<ClerkPlan[]> {
  try {
    const client = await clerkClient();
    
    // Try to fetch from Clerk API
    const response = await client.subscriptionPlans.list();
    
    if (!response || !response.data || response.data.length === 0) {
      console.warn('No plans found in Clerk, attempting alternative fetch...');
      return await fetchPlansAlternative();
    }
    
    return response.data.map(plan => ({
      id: plan.id,
      name: plan.name,
      key: plan.key,
      monthlyPrice: plan.monthlyPrice || 0,
      annualPrice: plan.annualPrice || 0,
      currency: plan.currency || 'USD',
      features: plan.features || [],
      metadata: plan.metadata || {},
    }));
  } catch (error) {
    console.error('Error fetching Clerk plans from API:', error);
    // Try alternative method
    return await fetchPlansAlternative();
  }
}

// Alternative: Fetch plans using Clerk's billing endpoint
async function fetchPlansAlternative(): Promise<ClerkPlan[]> {
  try {
    const client = await clerkClient();
    
    // Access billing plans through instance settings
    const instance = await client.instances.getInstance();
    
    // If Clerk billing is configured, plans should be available
    // This is a fallback that constructs plans from available data
    console.log('Instance billing configuration:', instance);
    
    // If we still can't get plans, throw error to inform user
    throw new Error('Unable to fetch subscription plans from Clerk. Please ensure billing is properly configured in Clerk Dashboard.');
  } catch (error) {
    console.error('Alternative fetch failed:', error);
    throw new Error('Subscription plans not available. Please configure billing in Clerk Dashboard first.');
  }
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

// Validate that all required plans are configured
export async function validatePlanConfiguration(): Promise<{
  valid: boolean;
  missingPlans: string[];
  availablePlans: string[];
}> {
  try {
    const plans = await getClerkSubscriptionPlans();
    const planKeys = plans.map(p => p.key);
    
    const requiredPlans = ['basic', 'intermediate', 'pro'];
    const missingPlans = requiredPlans.filter(key => !planKeys.includes(key));
    
    return {
      valid: missingPlans.length === 0,
      missingPlans,
      availablePlans: planKeys,
    };
  } catch (error) {
    return {
      valid: false,
      missingPlans: ['basic', 'intermediate', 'pro'],
      availablePlans: [],
    };
  }
}
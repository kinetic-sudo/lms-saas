'use client'

import { useUser } from "@clerk/nextjs"
import { CheckCircle2, AlertCircle, CreditCard, Calendar } from "lucide-react"

export const UserProfileSubscription = () => {
  const { user } = useUser();

  if (!user) return null;

  // 1. Read Plan from Metadata
  const planKey = (user.publicMetadata.plan as string) || 'basic';
  const status = (user.publicMetadata.subscriptionStatus as string) || 'active';
  const startDate = user.publicMetadata.subscriptionStartDate 
    ? new Date(user.publicMetadata.subscriptionStartDate as string).toLocaleDateString()
    : 'N/A';

  // Helper to style based on plan
  const isPro = planKey === 'pro';
  const isInter = planKey === 'intermediate';
  const isFree = planKey === 'basic';

  const planName = isPro ? 'Pro Companion' : isInter ? 'Intermediate Learner' : 'Basic Plan';
  const amount = isPro ? '₹4,000' : isInter ? '₹1,500' : '₹0';

  return (
    <div className="w-full p-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscription & Billing</h1>
        <p className="text-slate-500 text-sm">Manage your Razorpay subscription plan.</p>
      </div>

      {/* ACTIVE PLAN CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${isFree ? 'bg-slate-300' : 'bg-green-500'}`} />
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Plan</p>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {planName}
              {!isFree && (
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200">
                  {status}
                </span>
              )}
            </h2>
            <p className="text-slate-500 font-medium">{amount}<span className="text-slate-400 text-sm">/month</span></p>
          </div>

          <div className="bg-slate-50 p-3 rounded-full">
            <CreditCard className="text-slate-400" size={24} />
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <Calendar className="text-slate-400 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-slate-900">Start Date</p>
              <p className="text-sm text-slate-500">{startDate}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-slate-400 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-slate-900">Features</p>
              <p className="text-sm text-slate-500">
                {isPro ? 'Unlimited Everything' : isInter ? 'Unlimited Convos' : 'Limited Access'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      {!isFree ? (
        <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3 border border-slate-200">
          <AlertCircle className="text-slate-400" size={20} />
          <p className="text-sm text-slate-600">
            To cancel or change your plan, please contact support or wait for the billing cycle to end.
          </p>
        </div>
      ) : (
        <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between border border-indigo-100">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-indigo-500" size={20} />
            <p className="text-sm text-indigo-700 font-medium">Upgrade to unlock more features</p>
          </div>
          <a href="/subscription" className="text-xs font-bold bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition">
            View Plans
          </a>
        </div>
      )}
    </div>
  )
}
'use client'

import { useUser } from "@clerk/nextjs"
import { 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  Download, 
  FileText,
  Landmark
} from "lucide-react"

export const UserProfileSubscription = () => {
  const { user } = useUser();

  if (!user) return null;

  // 1. READ METADATA
  const md = user.publicMetadata;
  const planKey = (md.plan as string) || 'basic';
  const status = (md.subscriptionStatus as string) || 'active';
  const startDate = md.subscriptionStartDate 
    ? new Date(md.subscriptionStartDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';
  
  // New Payment Details (You'll need to save these in your action to see real data)
  const paymentMethod = (md.paymentMethod as string) || 'Razorpay Secure'; 
  const cardLast4 = (md.cardLast4 as string) || '••••';
  const paymentId = (md.razorpayPaymentId as string) || 'N/A';

  // Helper Logic
  const isPro = planKey === 'pro';
  const isInter = planKey === 'intermediate';
  const isFree = planKey === 'basic';

  const planName = isPro ? 'Pro Companion' : isInter ? 'Intermediate Learner' : 'Basic Plan';
  const amount = isPro ? '₹4,000' : isInter ? '₹1,500' : '₹0';

  return (
    <div className="w-full p-8 space-y-8 h-full overflow-y-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscription & Billing</h1>
        <p className="text-slate-500 text-sm">Manage your plan and payment details.</p>
      </div>

      {/* 1. ACTIVE PLAN CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${isFree ? 'bg-slate-300' : 'bg-green-500'}`} />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Plan</p>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {planName}
              {!isFree && (
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide border border-green-200">
                  {status}
                </span>
              )}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              {amount}<span className="text-slate-400 text-sm">/month</span>
            </p>
          </div>
          {/* Visual Icon */}
          <div className="bg-slate-50 p-3 rounded-full border border-slate-100">
            <Landmark className="text-slate-400" size={24} />
          </div>
        </div>

        {/* Plan Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-start gap-3">
            <Calendar className="text-slate-400 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Renews On</p>
              <p className="text-sm text-slate-600 font-medium">
                {isFree ? 'Never' : new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-slate-400 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Included Features</p>
              <p className="text-sm text-slate-600 font-medium line-clamp-1">
                {isPro ? 'All Features + Priority Support' : isInter ? 'Unlimited AI Conversations' : 'Basic Access Only'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PAYMENT METHOD (Only show if not free) */}
      {!isFree && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Payment Method</h3>
          
          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                {/* Generic Card Icon */}
                <CreditCard size={18} className="text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {paymentMethod} ending in {cardLast4}
                </p>
                <p className="text-xs text-slate-500">Expires 12/2028</p>
              </div>
            </div>
         
          </div>
        </div>
      )}

      {/* 3. BILLING HISTORY (Only show if not free) */}
      {!isFree && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Billing History</h3>
          
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700">Date</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Description</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Amount</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {/* Dynamically generating row from metadata */}
                <tr>
                  <td className="px-4 py-3 text-slate-600">{startDate}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {planName} Subscription
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">{paymentId}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-bold">{amount}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-1.5 text-slate-500 hover:text-black transition-colors text-xs font-bold border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                      <Download size={14} /> PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER NOTE */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3 border border-slate-200">
        <FileText className="text-slate-400 mt-0.5 shrink-0" size={18} />
        <div className="text-sm text-slate-600">
          <p className="font-bold text-slate-900 mb-1">Need help with billing?</p>
          <p>
            If you need to change your tax details or have questions about a charge, please contact our support team.
          </p>
        </div>
      </div>

    </div>
  )
}
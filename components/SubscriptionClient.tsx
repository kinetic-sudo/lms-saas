// components/SubscriptionClient.tsx
'use client'

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2 } from "lucide-react";

import SubscriptionHandler from "@/components/SubscriptionHandler";
import type { ClerkPlan } from "@/lib/clerk/plan";

interface SubscriptionClientProps {
  initialPlans: ClerkPlan[];
  activePlanKey: string;
  userId: string;
}

export default function SubscriptionClient({
  initialPlans,
  activePlanKey,
  userId,
}: SubscriptionClientProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  return (
    <main className="min-h-screen w-full py-20 px-4 md:px-10 flex flex-col items-center gap-12 bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
          Subscription Plans
        </h1>
        <p className="text-slate-500 font-medium">
          Current Plan:{" "}
          <span className="font-bold text-black capitalize">
            {activePlanKey}
          </span>
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-2 inline-flex items-center gap-2 shadow-sm">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            billingCycle === "monthly"
              ? "bg-black text-white shadow-md"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all relative ${
            billingCycle === "annual"
              ? "bg-black text-white shadow-md"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Annual
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            Save 20%
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl items-start">
        {initialPlans.map((plan, index) => {
          const isFree = plan.monthlyPriceINR === 0;
          const isPurchased = plan.key === activePlanKey;

          // Convert annualPrice (USD cents) to INR paise
          const annualPriceINR = Math.round(plan.annualPrice * 91);

          // Calculate price based on billing cycle
          const displayPrice =
            billingCycle === "monthly"
              ? plan.monthlyPriceINR
              : annualPriceINR;

          const monthlyEquivalent =
            billingCycle === "annual"
              ? Math.round(annualPriceINR / 12)
              : plan.monthlyPriceINR;

          const savings =
            billingCycle === "annual" && !isFree
              ? Math.round(
                  (plan.monthlyPriceINR * 12 - annualPriceINR) / 100
                )
              : 0;

          let containerClasses =
            "flex flex-col p-8 rounded-[2.5rem] h-full justify-between gap-8 transition-all duration-300 border relative ";
          let checkColor = "text-slate-500";

          if (isPurchased) {
            containerClasses +=
              "bg-white border-2 border-green-500 shadow-xl scale-[1.02] ring-4 ring-green-500/10 z-10";
            checkColor = "text-green-600";
          } else if (index === 0) {
            containerClasses +=
              "bg-[#FFF0F0] border-pink-100 hover:scale-[1.02]";
            checkColor = "text-pink-500";
          } else if (index === 1) {
            containerClasses +=
              "bg-[#FFFBEB] border-2 border-[#111111] shadow-[0_10px_40px_-15px_rgba(252,204,65,0.3)] hover:scale-[1.02]";
            checkColor = "text-orange-500";
          } else {
            containerClasses +=
              "bg-[#F5F3FF] border-violet-100 hover:scale-[1.02]";
            checkColor = "text-violet-500";
          }

          return (
            <div key={plan.id} className={containerClasses}>
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      {isFree ? "Starter" : "Pro Tier"}
                    </p>
                  </div>

                  {isPurchased ? (
                    <div className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={12} /> Active
                    </div>
                  ) : index === 1 ? (
                    <div className="bg-black text-[#FCCC41] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-sm">
                      Popular
                    </div>
                  ) : null}
                </div>

                {/* Pricing Display */}
                <div className="mb-6">
                  {billingCycle === "monthly" ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">
                        ₹{Math.round(displayPrice / 100)}
                      </span>
                      <span className="text-slate-500 font-medium">
                        /month
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-black text-slate-900">
                          ₹{Math.round(monthlyEquivalent / 100)}
                        </span>
                        <span className="text-slate-500 font-medium">
                          /month
                        </span>
                      </div>
                      {!isFree && (
                        <>
                          <p className="text-sm text-slate-500">
                            Billed ₹{Math.round(displayPrice / 100)} annually
                          </p>
                          <p className="text-xs text-green-600 font-bold mt-1">
                            💰 Save ₹{savings}/year
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <ul className="flex flex-col gap-4">
                  {plan.features.map((feature, i) => (
                    <FeatureItem key={i} text={feature} color={checkColor} />
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-6">
                {isPurchased ? (
                  <button
                    disabled
                    className="w-full bg-green-50 text-green-700 border border-green-200 font-bold py-4 rounded-2xl cursor-default flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} /> Current Plan
                  </button>
                ) : isFree ? (
                  <Link href="/companion" className="w-full">
                    <button className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:opacity-80 transition-opacity">
                      Get Started
                    </button>
                  </Link>
                ) : (
                  <button
                    className="razorpay-btn w-full bg-black text-white font-bold py-4 rounded-2xl transition-colors shadow-lg hover:opacity-90"
                    data-plan={plan.key}
                    data-billing={billingCycle}
                    data-user-id={userId}
                  >
                    {activePlanKey === "basic" ? "Subscribe" : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-slate-500 max-w-2xl">
        <p>
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </p>
        <p className="mt-2">
          Annual plans are billed once per year and save you 20%.
        </p>
      </div>

      <SubscriptionHandler />
    </main>
  );
}

const FeatureItem = ({ text, color }: { text: string; color: string }) => (
  <li className="flex items-center gap-3 text-slate-700 font-medium text-sm">
    <div className={`p-1 rounded-full bg-white ${color} flex-shrink-0`}>
      <Check size={14} strokeWidth={4} />
    </div>
    <span className="leading-tight">{text}</span>
  </li>
);


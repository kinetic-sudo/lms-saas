import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import SubscriptionHandler from "@/components/SubscriptionHandler"
import { getClerkSubscriptionPlans } from "@/lib/clerk/plan"

const Subscription = async () => {
  const { userId } = await auth();
  if(!userId) redirect('/sign-in');

  let plans = [];
  let error = null;

  try {
    plans = await getClerkSubscriptionPlans();
    plans.sort((a, b) => a.monthlyPriceINR - b.monthlyPriceINR);
  } catch (err: any) {
    error = err.message;
    console.error('Failed to load plans:', err);
  }

  return (
    <main className="min-h-screen w-full py-20 px-4 md:px-10 flex flex-col items-center gap-12 bg-white">
        
        <div className="text-center space-y-4">
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
              Subscription Plans
           </h1>
           <p className="text-slate-500 font-medium">
              Choose the right path for your learning journey.
           </p>
        </div>

        {/* Error Handling UI */}
        {error && (
          <div className="w-full max-w-4xl bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Configuration Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl items-start">
            {plans.map((plan, index) => {
                const isFree = plan.monthlyPriceINR === 0;
                
                // Card Styling Logic
                let containerClasses = "flex flex-col p-8 rounded-[2.5rem] h-full justify-between gap-8 hover:scale-[1.02] transition-transform duration-300 border ";
                let checkColor = "text-slate-500";
                
                if (index === 0) { // Basic
                    containerClasses += "bg-[#FFF0F0] border-pink-100";
                    checkColor = "text-pink-500";
                } else if (index === 1) { // Intermediate
                    containerClasses += "bg-[#FFFBEB] border-2 border-[#111111] shadow-[0_10px_40px_-15px_rgba(252,204,65,0.3)]";
                    checkColor = "text-orange-500";
                } else { // Pro
                    containerClasses += "bg-[#F5F3FF] border-violet-100";
                    checkColor = "text-violet-500";
                }

                return (
                    <div key={plan.id} className={containerClasses}>
                        
                        <div>
                            {/* --- HEADER FIX: FLEXBOX LAYOUT --- */}
                            {/* This keeps the Title and Badge separated so they don't overlap */}
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-3">
                                        {plan.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">
                                        {isFree ? "Perfect for starters" : index === 1 ? "More Companion. More Growth." : "Your Personal AI Academy"}
                                    </p>
                                </div>

                                {/* BADGE: Now inside the flex flow */}
                                {index === 1 && (
                                    <div className="bg-black text-[#FCCC41] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-sm mt-1">
                                        Popular
                                    </div>
                                )}
                            </div>

                            {/* Price Section */}
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-black text-slate-900">
                                    ₹{Math.round(plan.monthlyPriceINR / 100)}
                                </span>
                                <span className="text-slate-500 font-medium">/month</span>
                            </div>
                            
                            <p className="text-xs text-slate-400 mb-6">
                                (${plan.monthlyPrice / 100} USD)
                            </p>

                            <ul className="flex flex-col gap-4">
                                {plan.features.map((feature, i) => (
                                    <FeatureItem 
                                        key={i} 
                                        text={feature} 
                                        color={checkColor} 
                                    />
                                ))}
                            </ul>
                        </div>

                        {/* CTA Button */}
                        {isFree ? (
                            <Link href="/companion" className="w-full">
                                <button className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:opacity-80 transition-opacity shadow-md">
                                    Get Started
                                </button>
                            </Link>
                        ) : (
                            <button 
                                className="razorpay-btn w-full bg-black text-white font-bold py-4 rounded-2xl transition-colors shadow-lg hover:opacity-90"
                                data-plan={plan.key}
                            >
                                Subscribe Now
                            </button>
                        )}
                    </div>
                );
            })}
        </div>

        {plans.length > 0 && (
          <div className="max-w-4xl w-full text-center">
            <p className="text-sm text-slate-500">
              All plans are billed monthly. Cancel anytime.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Prices converted from USD to INR at rate: ₹91/USD
            </p>
          </div>
        )}

        <SubscriptionHandler />
    </main>
  )
}

const FeatureItem = ({text, color}: {text: string, color: string}) => (
    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm">
        <div className={`p-1 rounded-full bg-white ${color} flex-shrink-0`}>
            <Check size={14} strokeWidth={4} />
        </div>
        <span className="leading-tight">{text}</span>
    </li>
)

export default Subscription
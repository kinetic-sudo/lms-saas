import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Check } from "lucide-react"
import Link from "next/link"
import SubscriptionHandler from "@/components/SubscriptionHandler"
import { getClerkSubscriptionPlans } from "@/lib/clerk/plan"

const Subscription = async () => {
  const { userId } = await auth();
  if(!userId) redirect('/sign-in');

  // 1. Fetch Plans (Will use Fallback if API fails)
  const plans = await getClerkSubscriptionPlans();
  
  // 2. Sort by Price (Basic -> Intermediate -> Pro)
  const sortedPlans = plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

  return (
    <main className="min-h-screen w-full py-20 px-4 md:px-10 flex flex-col items-center gap-12 bg-white">
        
        {/* Header */}
        <div className="text-center space-y-4">
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
              Subscription Plans
           </h1>
           <p className="text-slate-500 font-medium">
              Choose the right path for your learning journey.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl items-start">
            
            {sortedPlans.map((plan, index) => {
                const isFree = plan.monthlyPrice === 0;
                
                // --- DYNAMIC STYLING BASED ON INDEX ---
                // Index 0 = Basic (Pink), Index 1 = Intermediate (Yellow), Index 2 = Pro (Violet)
                
                let containerClasses = "flex flex-col p-8 rounded-[2.5rem] h-full justify-between gap-8 hover:scale-[1.02] transition-transform duration-300 border ";
                let checkColor = "text-slate-500";
                
                if (index === 0) { // Basic
                    containerClasses += "bg-[#FFF0F0] border-pink-100";
                    checkColor = "text-pink-500";
                } else if (index === 1) { // Intermediate
                    containerClasses += "bg-[#FFFBEB] border-2 border-[#111111] shadow-[0_10px_40px_-15px_rgba(252,204,65,0.3)] relative";
                    checkColor = "text-orange-500";
                } else { // Pro
                    containerClasses += "bg-[#F5F3FF] border-violet-100";
                    checkColor = "text-violet-500";
                }

                return (
                    <div key={plan.id} className={containerClasses}>
                        
                        {/* Popular Badge for Intermediate */}
                        {index === 1 && (
                            <div className="absolute top-8 right-8 bg-[#F43F5E] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                Popular
                            </div>
                        )}

                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                            <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-wide">
                                {isFree ? "Perfect for starters" : index === 1 ? "More Companion. More Growth." : "Your Personal AI Academy"}
                            </p>
                            
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-slate-900">
                                    {plan.currency === 'USD' ? '$' : '₹'}
                                    {plan.monthlyPrice / 100}
                                </span>
                                <span className="text-slate-500 font-medium">/month</span>
                            </div>

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

                        {/* ACTION BUTTON */}
                        {isFree ? (
                            <Link href="/companion" className="w-full">
                                <button className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:opacity-80 transition-opacity">
                                    Get Started
                                </button>
                            </Link>
                        ) : (
                            <button 
                                className="razorpay-btn w-full bg-black text-white font-bold py-4 rounded-2xl transition-colors shadow-lg hover:opacity-90"
                                data-plan={plan.key} // IMPORTANT: This triggers the handler
                            >
                                Switch to this plan
                            </button>
                        )}
                    </div>
                );
            })}

        </div>

        {/* Load the Handler Logic */}
        <SubscriptionHandler />
    </main>
  )
}

// Helper Component for list items
const FeatureItem = ({text, color}: {text: string, color: string}) => (
    <li className="flex items-center gap-3 text-slate-700 font-medium text-sm">
        <div className={`p-1 rounded-full bg-white ${color}`}>
            <Check size={14} strokeWidth={4} />
        </div>
        {text}
    </li>
)

export default Subscription
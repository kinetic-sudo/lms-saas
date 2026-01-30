import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { PricingTable } from "@clerk/nextjs"

const Subscription = async () => {
  const { userId } = await auth();

  if(!userId) redirect('/sign-in');

  return (
    <main className="w-full max-w-7xl mx-auto py-20 px-4 md:px-10 flex flex-col items-center gap-12 bg-white">
        
        <div className="text-center space-y-4">
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
              Subscription Plans
           </h1>
           <p className="text-slate-500 font-medium">
              Choose the right path for your learning journey.
           </p>
        </div>

        <PricingTable
          appearance={{
            elements: {
              // Grid Layout
              pricingPageGrid: "w-full grid grid-cols-1 md:grid-cols-3 gap-8",
              
              // CARD: Added 'cl-plan-card' for CSS targeting
              pricingPageColumn: "cl-plan-card flex flex-col justify-between p-8 rounded-[2.5rem] hover:scale-[1.02] transition-transform duration-300 gap-6 h-full border",
              
              pricingPageHeader: "flex flex-col gap-4",
              pricingPageTitle: "text-2xl font-bold text-slate-900",
              pricingPagePriceAmount: "text-4xl font-black text-slate-900",
              
              // FEATURES: Added 'cl-plan-feature' for CSS targeting
              pricingPageFeatures: "flex flex-col gap-4 mt-4",
              pricingPageFeature: "cl-plan-feature flex items-center gap-3 text-slate-700 font-medium",
              
              // CTA BUTTON
              pricingPageCta: "w-full bg-black text-white font-bold py-4 rounded-2xl hover:opacity-80 transition-opacity mt-auto",
            },
            variables: {
              colorPrimary: "#111111",
              colorBackground: "#ffffff",
            },
          }}
        />

    </main>
  )
}

export default Subscription
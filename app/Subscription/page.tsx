import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Check } from "lucide-react"
import { PricingTable } from "@clerk/nextjs";

const Subscription = async () => {
  const { userId } = await auth();
  if(!userId) redirect('/sign-in');

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

        {/* Import Clerk's UserButton with billing */}
        <div className="w-full max-w-7xl">
          <PricingTable />
        </div>
    </main>
  )
}

export default Subscription
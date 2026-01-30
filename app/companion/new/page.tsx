import CompanionForm from "@/components/CompanionForm"
import { NewCompanionPermissions } from "@/lib/action/companion.action";
import { auth } from "@clerk/nextjs/server"
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const NewCompanion = async () => {
    const { userId } = await auth();
    if(!userId) redirect('/sign-in');

    const canCreateCompanion = await NewCompanionPermissions()

  return (
    // Changed justify-center to justify-start + pt-20 for "top-to-down" flow
    <main className="flex flex-col items-center  min-h-screen p-4 ">
      {canCreateCompanion ? (
        <div className="w-full  flex flex-col gap-8">
            <div className="flex flex-col gap-2 items-center text-center">
                <h1 className="text-3xl font-black tracking-tight text-[#111111]">
                    Companion Builder
                </h1>
                <p className="text-slate-500 font-medium max-w-md">
                    Configure your personalized AI learning assistant
                </p>
            </div>

            <article className="bg-white rounded-[2rem] p-6 md:p-10 ">
                <CompanionForm />
            </article>
        </div>
      ) : (
        <article className="companion-limit bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 text-center max-w-lg mt-10">
          <div className="flex justify-center mb-6">
             <Image src='/images/limit.svg' alt='Companion limit reached' width={300} height={200}/>
          </div>
          <div className="cta-badge mx-auto mb-4">
            Upgrade Your plan
          </div>
          <h1 className="text-2xl font-bold mb-2">
            You've Reached Your Limit
          </h1>
          <p className="text-slate-500 mb-8">
            You've reached your companion limit. Upgrade to create more companion and premium features.
          </p>
          <Link href='/Subscription' className="btn-primary w-full justify-center">
            Upgrade My Plan
          </Link>
        </article>
      )}
    </main>
  )
}

export default NewCompanion
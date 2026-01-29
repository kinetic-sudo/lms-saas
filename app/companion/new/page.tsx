
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
    <main className="lg:w-1/2 md:w-1/3 items-center justify-center">
      {canCreateCompanion ? (
        <article className="w-full flex flex-col gap-4">
            <h1>Companion Builder</h1>

            <CompanionForm />
        </article>
      ) : (
        <article className="companion-limit">
          <Image src='/images/limit.svg' alt='Companion limit reached' width={360} height={230}/>
          <div className="cta-badge">
            Upgrade Your plan
          </div>
          <h1>
            You've Reached Your Limit
          </h1>
          <p>
            You've reached your companion limit. Upgrade to create more companion and premium features.
          </p>
          <Link href='/Subscription' className="btn-primary w-full justify-center">
            Upgrade My Plan
          </Link>
        </article>
      )
    }
    </main>
  )
}

export default NewCompanion
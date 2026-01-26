'use '

import CompanionForm from "@/components/CompanionForm"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation";

const NewCompanion = async () => {
    const { userId } = await auth();
    if(!userId) redirect('/sign-in');

  return (
    <main className="lg:w-1/2 md:w-1/3 items-center justify-center">
        <article className="w-full flex flex-col gap-4 mt-[2rem]">
            <h1>Companion Builder</h1>

            <CompanionForm />
        </article>
    </main>
  )
}

export default NewCompanion
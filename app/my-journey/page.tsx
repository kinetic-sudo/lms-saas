import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {  getUserCompanion,  getUserSessions } from "@/lib/action/companion.action"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import CompanionList from "@/components/CompanionList"


const Profile = async () => {
  const user = await currentUser()

  if(!user) redirect('/sign-in')

  const companions  = await getUserCompanion(user.id)
  const sessionHistory = await getUserSessions(user.id)


  return (
    <main className="min-lg:w-3/4">
    <section className="flex justify-between gap-4 max-sm:flex-col max-sm:gap-6">
      <div className="flex gap-4 items-center max-sm:flex-col max-sm:items-center max-sm:gap-3">
        <Image 
          className="rounded-full" 
          src={user.imageUrl} 
          alt={user.firstName!} 
          width={110} 
          height={110}
        />
        <div className="flex flex-col gap-2 max-sm:w-full max-sm:text-center">
          <h1 className="font-bold text-xl">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground break-all">
            {user.emailAddresses[0].emailAddress}
          </p>
        </div> 
      </div>
      <div className="flex gap-4 max-sm:grid max-sm:grid-cols-2 max-sm:w-full max-sm:gap-3">
        <div className="border border-black rounded-lg p-3 gap-2 flex flex-col h-fit max-sm:w-full">
          <div className="flex gap-2 items-center">
            <Image src='/icons/check.svg' alt="checkmark" width={22} height={22} />
            <p className="text-2xl font-bold">
              {sessionHistory.length}
            </p>
          </div>
          <div className="text-sm">Lesson Completed</div>
        </div>
        <div className="border border-black rounded-lg p-3 gap-2 flex flex-col h-fit max-sm:w-full">
          <div className="flex gap-2 items-center">
            <Image src='/icons/cap.svg' alt="checkmark" width={22} height={22} />
            <p className="text-2xl font-bold">
              {companions.length}
            </p>
          </div>
          <div className="text-sm">Companion Created</div>
        </div>
      </div>
    </section>
    <Accordion type="multiple" className="mt-6">
      <AccordionItem value="recent">
        <AccordionTrigger className="text-2xl font-bold max-sm:text-lg">
          Recent Sessions{` (${sessionHistory.length})`}
        </AccordionTrigger>
        <AccordionContent>
          <CompanionList title="Recent Sessions" companions={sessionHistory} /> 
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="companion">
        <AccordionTrigger className="text-2xl font-bold max-sm:text-lg">
          My Companions{` (${companions.length})`}
        </AccordionTrigger>
        <AccordionContent>
          <CompanionList title="My Companion" companions={companions} /> 
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </main>
  )
}

export default Profile
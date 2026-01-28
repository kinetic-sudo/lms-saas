import CompanionComponent from "@/components/CompanionComponent";
import { getCompanion } from "@/lib/action/companion.action";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

interface CompanionSessionPageProps {
  params: Promise<{ id: string }>
}

//params / url/{id} => id 
// search url params has url / url?key=value&key1=value2 


const CompanionSession = async ({ params }: CompanionSessionPageProps) => {

  const { id } = await params;
  const companion = await getCompanion(id);
  const user = await currentUser();

  const  {name, subject, topic, duration} =  companion

  if(!user) redirect('/sign-in')
  if(!name) redirect('/companion')

  

  return (
    <main>
       <article className="flex rounded-full border border-black justify-between p-6 max-md:flex-col">
         <div className="flex items-center gap-2">
          <div className="size-[72px]  flex items-center justify-center rounded-full max-md:hidden" style={{backgroundColor: getSubjectColor(subject)}}>
            <Image src={`/icons/${subject}.svg`} alt={subject} width={35} height={35}/>
          </div>
           <div className="flex flex-col gap-3 ">
            <div className="flex items-center gap-3">
              <p className="font-bold text-2xl ml-2">
                {name}
              </p>
              <div className="subject-badge max-sm:hidden">
                {subject}
              </div>
            </div>
            <p className="text-lg ml-2">
              {topic}
            </p>
           </div>
         </div>
         <div className="ml-2 items-start text-2xl max-md:hidden">
          {duration} minutes
         </div>
       </article>
       <CompanionComponent
         {...companion}
         companionId={id}
         userName={user.firstName!}
         userImage={user.imageUrl!}

       />
    </main>
  )
}

export default CompanionSession
import CompanionComponent from "@/components/CompanionComponent";
import { getCompanion } from "@/lib/action/companion.action";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import { Clock } from "lucide-react"; 
import Image from "next/image";
import { redirect } from "next/navigation";

interface CompanionSessionPageProps {
  params: Promise<{ id: string }>
}

const CompanionSession = async ({ params }: CompanionSessionPageProps) => {

  const { id } = await params;
  const companion = await getCompanion(id);
  const user = await currentUser();

  const  {name, subject, topic, duration} =  companion

  if(!user) redirect('/sign-in')
  if(!name) redirect('/companion')

  return (
    // Added 'bg-slate-50' to make the white cards pop
    <main className="min-h-screen  p-4 md:p-10 flex flex-col items-center gap-8">
       {/* 1. Floating Pill Header */}
       <header className="bg-white rounded-full shadow-sm border border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between w-full max-w-5xl gap-4">
          <div className="flex items-center gap-4">
             <div 
               className="size-10 rounded-full flex items-center justify-center bg-opacity-10"
               style={{backgroundColor: `${getSubjectColor(subject)}20`}}
             >
                <Image src={`/icons/${subject}.svg`} alt={subject} width={20} height={20}/>
             </div>
             
             <div className="flex items-center gap-3">
                <h1 className="font-bold text-xl tracking-tight">{name}</h1>
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  {subject}
                </span>
                <span className="text-slate-400 text-sm hidden sm:block">•</span>
                <p className="text-slate-500 text-sm font-medium hidden sm:block truncate max-w-[200px]">
                  {topic}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-medium text-sm ml-auto">
             <Clock size={16} />
             <span>{duration} minutes remaining</span>
          </div>
       </header>

       {/* 2. Interactive Component */}
       <div className="w-full max-w-5xl">
          <CompanionComponent
            {...companion}
            companionId={id}
            userName={user.firstName!}
            userImage={user.imageUrl!}
          />
       </div>
    </main>
  )
}

export default CompanionSession
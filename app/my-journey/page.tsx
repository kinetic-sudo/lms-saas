import { getUserCompanion, getUserSessions } from "../../lib/action/companion.action"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import CompanionList from "@/components/CompanionList"
import { getSubjectColor } from "@/lib/utils"
import Link from "next/link"

const Profile = async () => {
  const user = await currentUser()

  if(!user) redirect('/sign-in')

  const companions = await getUserCompanion(user.id)
  const sessionHistory = await getUserSessions(user.id)

  return (
    <main className="w-full max-w-5xl mx-auto flex flex-col gap-12 pb-20">
      
      {/* 1. Profile Header & Stats */}
      <section className="flex flex-col gap-8">
        {/* Header Row */}
        <div className="flex items-center gap-4">
            <div className="relative">
                <Image 
                  className="rounded-full border-2 border-white shadow-sm" 
                  src={user.imageUrl} 
                  alt={user.firstName!} 
                  width={80} 
                  height={80}
                />
                <div className="absolute bottom-1 right-1 size-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
                <h1 className="font-bold text-2xl text-[#111111]">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-sm font-medium text-slate-400">
                  {user.emailAddresses[0].emailAddress}
                </p>
            </div>
        </div>

        {/* Stats Row (Big Numbers) */}
        <div className="flex items-center gap-16 border-b border-slate-100 pb-8">
            <div className="flex flex-col gap-1">
                <span className="text-4xl font-black text-indigo-500 tracking-tight">
                    {String(sessionHistory.length).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Lessons Done
                </span>
            </div>
            
            <div className="flex flex-col gap-1">
                <span className="text-4xl font-black text-orange-500 tracking-tight">
                    {String(companions.length).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Companions Created
                </span>
            </div>
        </div>
      </section>

      {/* 2. Recent Sessions Section */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
            <h2 className="text-xl font-bold text-[#111111]">Recent Sessions</h2>
            {/* <button className="text-sm font-bold text-indigo-500 hover:underline">History</button> */}
        </div>
        
        {/* Reusing your CompanionList which we styled as a clean list previously */}
        <div className=" rounded-[2rem] p-2">
            <CompanionList title="" companions={sessionHistory} /> 
        </div>
      </section>

      {/* 3. My Companions Section (Grid Layout) */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
             <h2 className="text-xl font-bold text-[#111111]">My Companions</h2>
             <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                {companions.length} Total
             </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companions.map((companion) => (
                <Link href={`/companion/${companion.id}`} key={companion.id}>
                    <article 
                        className="group flex items-start gap-4 p-6 rounded-[2rem] transition-transform hover:scale-[1.01] cursor-pointer"
                        style={{ backgroundColor: `${getSubjectColor(companion.subject)}70` }} 
                    >
                        {/* Icon Box */}
                        <div className="bg-white/60 p-3 rounded-2xl h-fit">
                            <Image 
                                src={`/icons/${companion.subject}.svg`} 
                                alt={companion.subject} 
                                width={24} 
                                height={24}
                            />
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-black leading-tight">
                                    {companion.name}
                                </h3>
                                {/* Optional: Activity indicator or menu dots */}
                            </div>
                            
                            <p className="text-xs font-bold text-black uppercase tracking-wide">
                                {companion.subject}
                            </p>
                            
                            <p className="text-sm text-black mt-2 line-clamp-1">
                                {companion.topic}
                            </p>
                        </div>
                    </article>
                </Link>
            ))}

            {/* Empty State if no companions */}
            {companions.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <p>No companions created yet.</p>
                    <Link href="/companion/new" className="text-indigo-500 font-bold hover:underline">
                        Create your first one
                    </Link>
                </div>
            )}
        </div>
      </section>

    </main>
  )
}

export default Profile
import { getUserCompanion, getUserSessions, getAllConversationHistories } from "@/lib/action/companion.action"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import JourneyTabs from "@/components/JourneyTab" // Import the new component

const Profile = async () => {
  const user = await currentUser()

  if(!user) redirect('/sign-in')

  // Fetch standard data
  const companions = await getUserCompanion(user.id)
  const sessionHistory = await getUserSessions(user.id)

  // Fetch saved conversations safely
  let savedConversations = [];
  try {
    savedConversations = await getAllConversationHistories();
  } catch (error) {
    console.log("Could not fetch conversation history:", error);
    // User might not have permission or subscription, default to empty array
    savedConversations = [];
  }

  return (
    <main className="w-full max-w-5xl mx-auto flex flex-col gap-12 pb-20">
      
      {/* 1. Header & Stats (Stays Static) */}
      <section className="flex flex-col gap-8">
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

      {/* 2. Tabs Section (Dynamic Content) */}
      <JourneyTabs 
        sessions={sessionHistory} 
        companions={companions} 
        savedConversations={savedConversations} 
      />

    </main>
  )
}

export default Profile
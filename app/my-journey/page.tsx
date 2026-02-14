import { getUserCompanion, getUserSessions, getAllConversationHistories } from "@/lib/action/companion.action"
import { getUserQuizHistory } from "@/lib/action/quiz.action"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Image from "next/image"
import JourneyTabs from "@/components/JourneyTab" 
import { getBookmarkedCompanions } from "@/lib/action/bookmark.action"

const Profile = async () => {
  const user = await currentUser()

  if(!user) redirect('/sign-in')

  // --- 1. GET PLAN STATUS ---
  const activePlan = (user.publicMetadata?.plan as string) || 'basic';
  const isPro = activePlan === 'pro' || activePlan === 'intermediate';

  const companions = await getUserCompanion(user.id)
  const sessionHistory = await getUserSessions(user.id)
  const bookmarkedCompanion = await getBookmarkedCompanions()

  // --- 2. FETCH PREMIUM FEATURES ---
  let savedConversations = [];
  let quizHistory = [];
  
  try {
    if (isPro) {
      savedConversations = await getAllConversationHistories();
      quizHistory = await getUserQuizHistory();
    }
  } catch (error) {
    console.error('Error fetching premium features:', error);
    savedConversations = [];
    quizHistory = [];
  }

  // --- 3. BADGE STYLING ---
  const badgeColor = activePlan === 'pro' ? 'bg-violet-100 text-violet-700 border-violet-200' : 
                     activePlan === 'intermediate' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                     'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <main className="w-full max-w-5xl mx-auto flex flex-col gap-12 pb-20">
      
      <section className="flex flex-col gap-8">
        <div className="flex items-center gap-6">
            <div className="relative">
                <Image 
                  className="rounded-full border-4 border-white shadow-lg" 
                  src={user.imageUrl} 
                  alt={user.firstName!} 
                  width={100} 
                  height={100}
                />
            </div>
            
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h1 className="font-bold text-3xl text-[#111111]">
                      {user.firstName} {user.lastName}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
                        {activePlan} Plan
                    </span>
                </div>
                <p className="text-base font-medium text-slate-400">
                  {user.emailAddresses[0].emailAddress}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-16 border-b border-slate-100 pb-8 pl-4">
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

            {/* NEW: Bookmarks stat */}
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black text-purple-500 tracking-tight">
                {String(bookmarkedCompanion.length).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Bookmarked
              </span>
            </div>

            {isPro && (
              <div className="flex flex-col gap-1">
                  <span className="text-4xl font-black text-purple-500 tracking-tight">
                      {String(quizHistory.length).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Quizzes Taken
                  </span>
              </div>
            )}
        </div>
      </section>

      <JourneyTabs 
        sessions={sessionHistory} 
        companions={companions} 
        savedConversations={savedConversations}
        quizHistory={quizHistory}
        isPro={isPro}
      />

    </main>
  )
}

export default Profile
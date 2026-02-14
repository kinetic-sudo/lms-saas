'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CompanionList from '@/components/CompanionList';
import { getSubjectColor, cn } from '@/lib/utils';
import { MessageCircle, Clock, BookOpen, Lock, Award, TrendingUp, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react';

interface JourneyTabsProps {
  sessions: any[];
  companions: any[];
  savedConversations: any[];
  quizHistory: any[];
  bookmarkedCompanions: any[]; 
  isPro: boolean;
}

const JourneyTabs = ({ 
  sessions, 
  companions, 
  savedConversations, 
  quizHistory,
  isPro,
  bookmarkedCompanions, 
}: JourneyTabsProps) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'saved' | 'quizzes' | 'bookmarks'>('sessions');

  return (
    <div className="flex flex-col gap-8">
      
      {/* --- TAB HEADERS --- */}
      <div className="flex items-center gap-8 border-b border-slate-100">
        <button
          onClick={() => setActiveTab('sessions')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === 'sessions' 
              ? "text-black" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          Sessions
          {activeTab === 'sessions' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === 'saved' 
              ? "text-black" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          Saved Conversations
          {activeTab === 'saved' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative flex items-center gap-2",
            activeTab === 'quizzes' 
              ? "text-black" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          Quizzes
          {!isPro && <Lock size={14} className="text-slate-400" />}
          {activeTab === 'quizzes' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === 'bookmarks' 
              ? "text-black" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Bookmark size={16} />
          {activeTab === 'bookmarks' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full" />
          )}
        </button>
      </div>

      {/* --- TAB CONTENT --- */}

      {/* 1. SESSIONS TAB */}
      {activeTab === 'sessions' && (
         <div className="bg-slate-50/50 rounded-[2rem] p-2">
            <CompanionList title="" companions={sessions} /> 
         </div>
      )}

      {/* 2. SAVED CONVERSATIONS TAB */}
      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {savedConversations.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <MessageCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium mb-4">No saved conversations yet</p>
                <Link href="/companion" className="text-indigo-600 font-bold hover:underline">
                    Start a conversation
                </Link>
             </div>
           ) : (
             savedConversations.map((conv: any) => {
                const messageCount = conv.messages?.length || 0;
                const lastMessageDate = new Date(conv.last_message_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                if (!conv.companion) return null;

                return (
                  <Link href={`/companion/${conv.companion_id}`} key={conv.id}>
                    <div 
                      className="p-6 rounded-[2rem] border-2 border-transparent hover:border-slate-100 hover:scale-[1.02] transition-transform cursor-pointer flex flex-col gap-4"
                      style={{ backgroundColor: `${getSubjectColor(conv.companion.subject)}20` }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: getSubjectColor(conv.companion.subject) }}
                        >
                          <Image 
                            src={`/icons/${conv.companion.subject}.svg`}
                            alt={conv.companion.subject}
                            width={24}
                            height={24}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-900">{conv.companion.name}</h3>
                          <p className="text-sm text-slate-600">{conv.companion.topic}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 bg-white/50 p-3 rounded-xl w-fit">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={16} />
                          <span>{messageCount} msgs</span>
                        </div>
                        <div className="w-px h-3 bg-slate-400/30"></div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} />
                          <span>{lastMessageDate}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
             })
           )}
        </div>
      )}

      {/* 3. QUIZZES TAB */}
      {activeTab === 'quizzes' && (
  <>
    {!isPro ? (
      // LOCKED STATE (Kept same as before)
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-[2.5rem] p-12 border-2 border-purple-100 text-center">
        <div className="flex justify-center mb-6">
          <div className="size-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Lock size={40} className="text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-3">
          Quizzes are Premium Only
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Upgrade to <span className="font-bold text-purple-600">Intermediate</span> or{' '}
          <span className="font-bold text-blue-600">Pro</span> to access personalized quizzes and track your progress!
        </p>
        
        <Link 
          href="/subscription"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition"
        >
          <TrendingUp size={20} />
          Upgrade Now
        </Link>
      </div>
    ) : (
      // UNLOCKED STATE - New Design matching Screenshot
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {quizHistory.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium mb-4">No quizzes taken yet</p>
            <Link href="/companion" className="text-emerald-600 font-bold hover:underline">
              Start learning and take your first quiz
            </Link>
          </div>
        ) : (
          quizHistory.map((quiz: any) => {
            if (!quiz.companion) return null;

            const isCompleted = quiz.status === 'completed';
            
            // Format Date
            const dateStr = quiz.completed_at || quiz.created_at;
            const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
               month: 'short', day: 'numeric', year: 'numeric'
            });

            // Determine Colors based on score
            const scoreColor = quiz.percentage >= 80 ? 'text-emerald-600' : 
                             quiz.percentage >= 60 ? 'text-blue-600' : 'text-orange-600';
            
            return (
              <Link 
                href={isCompleted
                  ? `/quiz/${quiz.id}/results?score=${quiz.score}&total=${quiz.total_questions}&percentage=${quiz.percentage}` 
                  : `/quiz/${quiz.id}`
                } 
                key={quiz.id}
              >
                <div className="group h-full bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer flex flex-col justify-between">
                  
                  {/* Header: Icon & Title */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="size-12 flex-shrink-0 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <BookOpen size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-1">
                        {quiz.companion.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                        {quiz.topic}
                      </p>
                    </div>
                  </div>

                  {/* Stats Box (The gray container) */}
                  <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between">
                      
                      {/* Score Section */}
                      <div>
                        <p className={`text-3xl font-black ${isCompleted ? scoreColor : 'text-slate-400'}`}>
                          {isCompleted ? `${Math.round(quiz.percentage)}%` : '--'}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          Score
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-10 bg-slate-200 mx-2"></div>

                      {/* Correct Count Section */}
                      <div>
                        <p className="text-3xl font-black text-slate-900">
                          {isCompleted ? `${quiz.score}/${quiz.total_questions}` : `0/${quiz.total_questions}`}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          Correct
                        </p>
                      </div>

                      {/* Status Badge Section */}
                      <div className="text-right flex flex-col items-end gap-1">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            <CheckCircle2 size={12} strokeWidth={3} /> Completed
                          </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            <Clock size={12} strokeWidth={3} /> Pending
                          </span>
                        )}
                        <p className="text-xs font-medium text-slate-400">
                          {formattedDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold group-hover:gap-3 transition-all">
                    {isCompleted ? 'View Full Results' : 'Continue Quiz'} 
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>

                </div>
              </Link>
            );
          })
        )}
      </div>
    )}
  </>
)}

      {/* 4. MY COMPANIONS TAB */}
      {activeTab === 'bookmarks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {bookmarkedCompanions.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <Bookmark size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium mb-4">No bookmarked companions yet</p>
              <Link href="/companion" className="text-purple-600 font-bold hover:underline">
                Browse companions and bookmark your favorites
              </Link>
            </div>
          ) : (
            bookmarkedCompanions.map((companion) => (
              <Link href={`/companion/${companion.id}`} key={companion.id}>
                <article 
                  className="group flex items-start gap-4 p-6 rounded-[2rem] border-2 border-transparent hover:border-purple-200 transition-all cursor-pointer"
                  style={{ backgroundColor: `${getSubjectColor(companion.subject)}70` }} 
                >
                  <div className="bg-white/60 p-3 rounded-2xl h-fit">
                    <Image 
                      src={`/icons/${companion.subject}.svg`} 
                      alt={companion.subject} 
                      width={24} 
                      height={24}
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-black leading-tight">
                        {companion.name}
                      </h3>
                      <Bookmark size={18} className="text-purple-600" fill="currentColor" />
                    </div>
                    <p className="text-xs font-bold text-black/70 uppercase tracking-wide">
                      {companion.subject}
                    </p>
                    <p className="text-sm text-black/80 mt-2 line-clamp-1">
                      {companion.topic}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-black/60">
                      <Clock size={14} />
                      <span>{companion.duration} minutes</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      )}


    </div>
  );
};

export default JourneyTabs;
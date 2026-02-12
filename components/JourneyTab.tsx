'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CompanionList from '@/components/CompanionList';
import { getSubjectColor, cn } from '@/lib/utils';
import { MessageCircle, Clock, BookOpen, Lock, Award, TrendingUp } from 'lucide-react';

interface JourneyTabsProps {
  sessions: any[];
  companions: any[];
  savedConversations: any[];
  quizHistory: any[];
  isPro: boolean;
}

const JourneyTabs = ({ 
  sessions, 
  companions, 
  savedConversations, 
  quizHistory,
  isPro 
}: JourneyTabsProps) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'saved' | 'quizzes' | 'companions'>('sessions');

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
          onClick={() => setActiveTab('companions')}
          className={cn(
            "pb-4 text-sm font-bold transition-all relative",
            activeTab === 'companions' 
              ? "text-black" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          My Companions
          {activeTab === 'companions' && (
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
            // LOCKED STATE - Upgrade prompt
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
            // UNLOCKED STATE - Show quiz history
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {quizHistory.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium mb-4">No quizzes taken yet</p>
                  <Link href="/companion" className="text-purple-600 font-bold hover:underline">
                    Start learning and take your first quiz
                  </Link>
                </div>
              ) : (
                quizHistory.map((quiz: any) => {
                  if (!quiz.companion) return null;

                  const completedDate = quiz.completed_at 
                    ? new Date(quiz.completed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'In Progress';

                  const statusColor = quiz.status === 'completed' ? 'text-green-600' : 'text-orange-600';
                  const scoreColor = quiz.percentage >= 80 ? 'text-green-600' : 
                                   quiz.percentage >= 60 ? 'text-blue-600' : 'text-orange-600';

                  return (
                    <Link 
                      href={quiz.status === 'completed' 
                        ? `/quiz/${quiz.id}/results?score=${quiz.score}&total=${quiz.total_questions}&percentage=${quiz.percentage}` 
                        : `/quiz/${quiz.id}`
                      } 
                      key={quiz.id}
                    >
                      <div 
                        className="p-6 rounded-[2rem] border-2 border-transparent hover:border-purple-200 hover:scale-[1.02] transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-blue-50"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 rounded-xl bg-purple-500">
                            <BookOpen size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-900">{quiz.companion.name}</h3>
                            <p className="text-sm text-slate-600">{quiz.topic}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/60 p-4 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className={`text-2xl font-black ${scoreColor}`}>
                                {quiz.status === 'completed' ? `${Math.round(quiz.percentage)}%` : '--'}
                              </p>
                              <p className="text-xs text-slate-500 font-bold">Score</p>
                            </div>
                            
                            <div className="w-px h-8 bg-slate-300"></div>
                            
                            <div className="text-center">
                              <p className="text-2xl font-black text-slate-900">
                                {quiz.status === 'completed' ? `${quiz.score}/${quiz.total_questions}` : `0/${quiz.total_questions}`}
                              </p>
                              <p className="text-xs text-slate-500 font-bold">Correct</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`text-xs font-bold uppercase ${statusColor}`}>
                              {quiz.status === 'completed' ? '✓ Completed' : 'In Progress'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{completedDate}</p>
                          </div>
                        </div>

                        {quiz.status === 'completed' && (
                          <div className="mt-3 flex items-center justify-center gap-2 text-purple-600 text-sm font-bold">
                            <Award size={16} />
                            View Results
                          </div>
                        )}
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
      {activeTab === 'companions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companions.map((companion) => (
                <Link href={`/companion/${companion.id}`} key={companion.id}>
                    <article 
                        className="group flex items-start gap-4 p-6 rounded-[2rem] transition-transform hover:scale-[1.01] cursor-pointer"
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
                            <h3 className="font-bold text-lg text-black leading-tight">
                                {companion.name}
                            </h3>
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
             {companions.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <p>No companions created yet.</p>
                </div>
            )}
        </div>
      )}

    </div>
  );
};

export default JourneyTabs;
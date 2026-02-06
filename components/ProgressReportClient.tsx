// components/ProgressReportClient.tsx
'use client'
import React from 'react'
import { TrendingUp, Target, BookOpen, ArrowRight, Award } from 'lucide-react'

interface Props {
  progress: any;
  quizHistory: any[];
  userName: string;
}

const ProgressReportClient = ({ progress, quizHistory, userName }: Props) => {
  const stats = [
    { 
      label: 'Current Streak', 
      value: `${progress?.current_streak_days || 0} Days`, 
      icon: FireIcon, 
      color: 'text-orange-500', 
      bg: 'bg-orange-50' 
    },
    { 
      label: 'Quiz Accuracy', 
      value: `${Math.round(progress?.average_quiz_score || 0)}%`, 
      icon: Target, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Total Quizzes', 
      value: progress?.total_quizzes_taken || 0, 
      icon: BookOpen, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
  ];

  // Get concept mastery from quiz history
  const conceptScores = quizHistory.reduce((acc: any, quiz) => {
    quiz.key_concepts?.forEach((concept: string) => {
      if (!acc[concept]) {
        acc[concept] = { total: 0, count: 0 };
      }
      acc[concept].total += quiz.percentage || 0;
      acc[concept].count += 1;
    });
    return acc;
  }, {});

  const concepts = Object.entries(conceptScores).map(([name, data]: [string, any]) => ({
    name,
    score: Math.round(data.total / data.count),
  }));

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 md:px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Learning Progress
          </h1>
          <p className="text-slate-500 mt-2">
            Great work, {userName}! Here's your learning journey.
          </p>
        </header>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Concept Mastery */}
        {concepts.length > 0 && (
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Concept Mastery
              </h2>
            </div>

            <div className="space-y-6">
              {concepts.map((concept) => (
                <div key={concept.name}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700">{concept.name}</span>
                    <span className="text-slate-900 font-bold">{concept.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        concept.score >= 80 ? 'bg-emerald-500' : 
                        concept.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${concept.score}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz History */}
        {quizHistory.length > 0 && (
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              Recent Quizzes
            </h2>
            
            <div className="space-y-4">
              {quizHistory.slice(0, 5).map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">{quiz.topic}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round(quiz.percentage || 0)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {quiz.score}/{quiz.total_questions}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {quizHistory.length === 0 && (
          <div className="bg-white rounded-[2rem] p-12 border border-slate-100 shadow-sm text-center">
            <p className="text-slate-500 mb-4">No quizzes completed yet</p>
            <button 
              onClick={() => window.location.href = '/companion'}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800"
            >
              Start Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const FireIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.243-2.143.707-3.071C6.162 13.064 7.275 14.5 8.5 14.5z"/></svg>
);

export default ProgressReportClient;
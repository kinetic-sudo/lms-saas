// app/quiz/[quizId]/results/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { Award, TrendingUp, Home, CheckCircle2, XCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect, useState } from 'react'
import { getQuizResults } from '@/lib/action/quiz.action'

export default function QuizResults() {
  const router = useRouter();
  const params = useParams();
  const quizSessionId = params.quizSessionId as string;
  
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const result = await getQuizResults(quizSessionId);
        
        if (result.success && result.data) {
          setQuizData(result.data);
          
          // Trigger confetti for good scores
          if (result.data.percentage >= 70) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
              confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#10B981', '#3B82F6']
              });
              confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#10B981', '#3B82F6']
              });

              if (Date.now() < end) {
                requestAnimationFrame(frame);
              }
            };
            frame();
          }
        }
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    };

    if (quizSessionId) {
      loadResults();
    }
  }, [quizSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          <p className="text-slate-500 font-medium animate-pulse">Calculating score...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-sm border border-slate-100">
          <p className="text-xl font-bold text-slate-900 mb-4">Results not found</p>
          <button
            onClick={() => router.push('/companion')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { score, total, percentage, questions } = quizData;

  // Determine status message based on score
  const getStatus = () => {
    if (percentage >= 90) return { title: 'Outstanding!', subtitle: 'You nailed it perfectly.', color: 'text-emerald-600' };
    if (percentage >= 70) return { title: 'Great Job!', subtitle: 'Quiz successfully completed.', color: 'text-slate-900' };
    if (percentage >= 50) return { title: 'Good Effort!', subtitle: 'You are getting there.', color: 'text-blue-600' };
    return { title: 'Keep Practicing', subtitle: 'Don\'t give up, try again!', color: 'text-orange-600' };
  };

  const status = getStatus();

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 md:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* 1. Main Score Card */}
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 text-center">
          
          {/* Badge Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-6">
            <Award className="w-8 h-8 text-slate-900" />
          </div>

          <h1 className={`text-3xl md:text-4xl font-extrabold mb-2 ${status.color}`}>
            {status.title}
          </h1>
          <p className="text-slate-500 font-medium mb-10">
            {status.subtitle}
          </p>

          {/* Big Score Display */}
          <div className="mb-10 relative">
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="text-7xl font-black text-slate-900 tracking-tight">{score}</span>
              <span className="text-3xl font-bold text-slate-300">/{total}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="max-w-xs mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
            <div className="text-center border-r border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Accuracy</p>
              <p className="text-2xl font-black text-slate-900">{Math.round(percentage)}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
              <p className="text-2xl font-black text-slate-900 flex items-center justify-center gap-1">
                2:34 <span className="text-xs font-normal text-slate-400">min</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Review Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
            <TrendingUp className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Review Questions</h2>
            <p className="text-sm text-slate-500">Analysis of your performance</p>
          </div>
        </div>

        {/* 3. Questions List */}
        <div className="space-y-6">
          {questions.map((q: any, index: number) => {
            const isCorrect = q.user_answer === q.correct_answer;
            const userAnswer = q.options.find((opt: any) => opt.id === q.user_answer);
            
            return (
              <div key={q.id} className="bg-white rounded-[1.5rem] p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden">
                
                {/* Question Status Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Question {index + 1}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    isCorrect 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-rose-50 text-rose-600'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-lg font-bold text-slate-900 leading-relaxed mb-6">
                  {q.question_text}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {q.options.map((option: any) => {
                    // Logic to determine option style
                    const isSelected = option.id === q.user_answer;
                    const isCorrectAnswer = option.id === q.correct_answer;
                    
                    let cardStyle = "border-slate-100 bg-white hover:border-slate-200";
                    let textStyle = "text-slate-600";
                    let icon = null;

                    if (isSelected && isCorrect) {
                      // Selected & Correct (Green)
                      cardStyle = "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500";
                      textStyle = "text-emerald-900 font-semibold";
                      icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                    } else if (isSelected && !isCorrect) {
                      // Selected & Wrong (Red)
                      cardStyle = "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500";
                      textStyle = "text-rose-900 font-semibold";
                      icon = <XCircle className="w-5 h-5 text-rose-500" />;
                    } else if (!isSelected && isCorrectAnswer) {
                      // Not selected but is the correct answer (Show correct)
                      cardStyle = "border-emerald-200 bg-emerald-50/30 border-dashed";
                      textStyle = "text-emerald-700 font-medium";
                      icon = <CheckCircle2 className="w-5 h-5 text-emerald-300" />;
                    }

                    return (
                      <div 
                        key={option.id}
                        className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ${cardStyle}`}
                      >
                        <span className={`pr-8 ${textStyle}`}>
                          {option.text}
                        </span>
                        {icon && <div className="flex-shrink-0">{icon}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box (Optional - only if it exists) */}
                {q.explanation && (
                  <div className="mt-6 pt-6 border-t border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Explanation
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. Sticky Bottom Action Bar */}
        {/* <div className="sticky bottom-6 mt-8">
          <div className="bg-slate-900 rounded-2xl p-2 flex items-center justify-between shadow-xl shadow-slate-900/20">
             <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-slate-400 hover:text-white font-bold transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="w-px h-8 bg-slate-700/50"></div>
            <button
              onClick={() => router.push('/learn')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-white font-bold hover:bg-slate-800 rounded-xl transition-all"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div> */}

      </div>
    </div>
  );
}
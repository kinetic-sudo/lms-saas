// app/quiz/[quizId]/results/page.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Award, TrendingUp, RotateCcw, Home } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export default function QuizResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const score = parseInt(searchParams.get('score') || '0');
  const total = parseInt(searchParams.get('total') || '5');
  const percentage = parseFloat(searchParams.get('percentage') || '0');

  useEffect(() => {
    // Celebrate if score is good!
    if (percentage >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [percentage]);

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { emoji: '🎉', message: 'Outstanding!', color: 'text-emerald-600' };
    if (percentage >= 80) return { emoji: '⭐', message: 'Great Job!', color: 'text-blue-600' };
    if (percentage >= 70) return { emoji: '👍', message: 'Good Work!', color: 'text-purple-600' };
    if (percentage >= 60) return { emoji: '📚', message: 'Keep Learning!', color: 'text-orange-600' };
    return { emoji: '💪', message: 'Keep Practicing!', color: 'text-slate-600' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl border border-slate-100">
        
        {/* Trophy Icon */}
        <div className="flex justify-center mb-6">
          <div className="size-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Award size={48} className="text-white" />
          </div>
        </div>

        {/* Results */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2">
            <span className="text-6xl">{performance.emoji}</span>
          </h1>
          <h2 className={`text-3xl font-bold mb-4 ${performance.color}`}>
            {performance.message}
          </h2>
          
          <div className="flex items-center justify-center gap-8 mb-6">
            <div>
              <p className="text-6xl font-black text-slate-900">{score}</p>
              <p className="text-sm text-slate-500 font-bold">Correct</p>
            </div>
            <div className="text-4xl text-slate-300">/</div>
            <div>
              <p className="text-6xl font-black text-slate-400">{total}</p>
              <p className="text-sm text-slate-500 font-bold">Total</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 inline-block">
            <p className="text-sm text-slate-600 font-bold mb-1">Your Score</p>
            <p className="text-4xl font-black text-slate-900">{Math.round(percentage)}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/progress-report')}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition"
          >
            <TrendingUp size={20} />
            View Progress
          </button>
          
          <button
            onClick={() => router.push('/companion')}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition"
          >
            <Home size={20} />
            Continue Learning
          </button>
        </div>

        {/* Footer Message */}
        <p className="text-center text-sm text-slate-500 mt-6">
          {percentage >= 70 
            ? "Great progress! Keep up the momentum 🚀" 
            : "Review the concepts and try again to master this topic 📚"}
        </p>
      </div>
    </div>
  );
}
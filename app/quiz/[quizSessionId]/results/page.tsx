// app/quiz/[quizId]/results/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { Award, TrendingUp, Home, CheckCircle2, XCircle, Lightbulb } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect, useState } from 'react'
import { getQuizResults } from '@/lib/action/quiz.action'

export default function QuizResults() {
  const router = useRouter();
  const params = useParams();
  const quizSessionId = params.quizSessionId as string; // FIXED: Match folder name
  
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const loadResults = async () => {
      try {
        const result = await getQuizResults(quizSessionId);
        
        if (result.success && result.data) {
          setQuizData(result.data);
          
          // Celebrate if score is good!
          if (result.data.percentage >= 80) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <p className="text-xl font-bold text-slate-900 mb-4">Results not found</p>
          <button
            onClick={() => router.push('/companion')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { score, total, percentage, questions } = quizData;

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { emoji: '🎉', message: 'Outstanding!', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
    if (percentage >= 80) return { emoji: '⭐', message: 'Great Job!', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (percentage >= 70) return { emoji: '👍', message: 'Good Work!', color: 'text-purple-600', bgColor: 'bg-purple-50' };
    if (percentage >= 60) return { emoji: '📚', message: 'Keep Learning!', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { emoji: '💪', message: 'Keep Practicing!', color: 'text-slate-600', bgColor: 'bg-slate-50' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Score Summary Card */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
          
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
        </div>

        {/* Detailed Review Section */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Lightbulb size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Question Review</h2>
              <p className="text-sm text-slate-500">See how you did on each question</p>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q: any, index: number) => {
              const isCorrect = q.user_answer === q.correct_answer;
              const selectedOption = q.options.find((opt: any) => opt.id === q.user_answer);
              const correctOption = q.options.find((opt: any) => opt.id === q.correct_answer);

              return (
                <div
                  key={q.id}
                  className={`border-2 rounded-2xl p-6 transition-all ${
                    isCorrect 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle2 size={24} className="text-white" />
                      ) : (
                        <XCircle size={24} className="text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Question {index + 1}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          isCorrect 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-relaxed">
                        {q.question_text}
                      </h3>
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-3 mb-4">
                    {q.options.map((option: any) => {
                      const isUserAnswer = option.id === q.user_answer;
                      const isCorrectAnswer = option.id === q.correct_answer;
                      
                      return (
                        <div
                          key={option.id}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-100'
                              : isUserAnswer && !isCorrect
                              ? 'border-red-500 bg-red-100'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`size-6 rounded-full border-2 flex items-center justify-center ${
                              isCorrectAnswer
                                ? 'border-green-500 bg-green-500'
                                : isUserAnswer && !isCorrect
                                ? 'border-red-500 bg-red-500'
                                : 'border-slate-300'
                            }`}>
                              {isCorrectAnswer && (
                                <CheckCircle2 size={16} className="text-white" />
                              )}
                              {isUserAnswer && !isCorrect && (
                                <XCircle size={16} className="text-white" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <p className={`font-medium ${
                                isCorrectAnswer
                                  ? 'text-green-900'
                                  : isUserAnswer && !isCorrect
                                  ? 'text-red-900'
                                  : 'text-slate-700'
                              }`}>
                                {option.text}
                              </p>
                              
                              {isUserAnswer && (
                                <p className="text-xs font-bold mt-1 text-slate-600">
                                  Your answer
                                </p>
                              )}
                              
                              {isCorrectAnswer && !isUserAnswer && (
                                <p className="text-xs font-bold mt-1 text-green-700">
                                  Correct answer
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="bg-white rounded-xl p-4 border-2 border-slate-200">
                    <div className="flex items-start gap-3">
                      <Lightbulb size={20} className="text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Explanation
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/companion')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all active:scale-95"
            >
              <TrendingUp size={20} />
              Continue Learning
            </button>
            
            <button
              onClick={() => router.push('/my-journey')}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
            >
              <Home size={20} />
              View Progress
            </button>
          </div>

          {/* Footer Message */}
          <p className="text-center text-sm text-slate-500 mt-4">
            {percentage >= 70 
              ? "Great progress! Keep up the momentum 🚀" 
              : "Review the concepts and try again to master this topic 📚"}
          </p>
        </div>
      </div>
  );
}
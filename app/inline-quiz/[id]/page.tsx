// app/quiz/[quizId]/page.tsx - COMPLETE UPDATED VERSION
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import InlineQuizComponent from '@/components/InlineQuizzComponent'
import { getQuizData, submitQuizAnswers } from '@/lib/action/quiz.action'
import { Loader2, Lock, TrendingUp } from 'lucide-react'

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const quizId = params.quizId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccessAndLoadQuiz = async () => {
      try {
        setLoading(true);
        
        // Check subscription
        const planKey = (user?.publicMetadata?.plan as string) || 'basic';
        const hasQuizAccess = planKey === 'intermediate' || planKey === 'pro';
        
        setHasAccess(hasQuizAccess);
        
        if (!hasQuizAccess) {
          setLoading(false);
          return;
        }

        // Load quiz data
        console.log('Loading quiz:', quizId);
        const result = await getQuizData(quizId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to load quiz');
        }

        console.log('Quiz loaded:', result.data);
        setQuizData(result.data);
      } catch (err: any) {
        console.error('Error loading quiz:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (quizId && user) {
      checkAccessAndLoadQuiz();
    }
  }, [quizId, user]);

  const handleQuizCompletion = async (answers: Record<number, string>) => {
    try {
      console.log('Submitting answers:', answers);
      
      const result = await submitQuizAnswers(quizId, answers);

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit quiz');
      }

      console.log('Quiz submitted:', result);
      
      // Redirect to results page
      router.push(`/quiz/${quizId}/results?score=${result.score}&total=${result.total}&percentage=${result.percentage}`);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  // No access - Upgrade prompt
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl border border-purple-100">
          
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="size-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Lock size={48} className="text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Quizzes are Premium Only
            </h1>
            <p className="text-slate-600 text-lg mb-6">
              Unlock personalized quizzes and track your progress with our premium plans!
            </p>

            {/* Features */}
            <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8">
              <h3 className="font-bold text-slate-900 mb-4">Premium Features:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700">AI-generated quizzes after every session</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700">Save conversation history</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700">Track your progress over time</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-700">Detailed session summaries and recaps</span>
                </li>
              </ul>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                <h4 className="font-bold text-lg text-slate-900 mb-2">Intermediate Learner</h4>
                <p className="text-3xl font-black text-slate-900 mb-1">₹1,365<span className="text-sm font-medium text-slate-500">/month</span></p>
                <p className="text-xs text-slate-600 mb-4">Perfect for regular learners</p>
                <ul className="text-xs text-slate-600 space-y-1 text-left">
                  <li>✓ Unlimited sessions</li>
                  <li>✓ Save history</li>
                  <li>✓ Quizzes & progress</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-300 relative">
                <div className="absolute -top-3 -right-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
                <h4 className="font-bold text-lg text-slate-900 mb-2">Pro Companion</h4>
                <p className="text-3xl font-black text-slate-900 mb-1">₹3,640<span className="text-sm font-medium text-slate-500">/month</span></p>
                <p className="text-xs text-slate-600 mb-4">Everything + priority support</p>
                <ul className="text-xs text-slate-600 space-y-1 text-left">
                  <li>✓ All Intermediate features</li>
                  <li>✓ Priority support</li>
                  <li>✓ Early access</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push('/subscription')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp size={24} />
              Upgrade to Premium
            </button>

            <button
              onClick={() => router.push('/companion')}
              className="w-full mt-3 text-slate-500 font-medium hover:text-slate-700 transition"
            >
              Go back to learning
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center border border-red-100">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Quiz Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'This quiz does not exist or has expired.'}</p>
          <button
            onClick={() => router.push('/my-journey')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800"
          >
            Go to My Journey
          </button>
        </div>
      </div>
    );
  }

  // Quiz loaded - show quiz interface
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 md:px-6">
      <InlineQuizComponent 
        summary={quizData.summary}
        questions={quizData.questions}
        userName={user?.firstName || 'Student'}
        onComplete={handleQuizCompletion}
      />
    </div>
  );
}
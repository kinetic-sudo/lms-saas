// app/quiz/[quizSessionId]/page.tsx
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
  const { user, isLoaded } = useUser();
  const quizSessionId = params.quizSessionId as string; // FIXED: Match folder name

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccessAndLoadQuiz = async () => {
      try {
        if (!isLoaded) {
          console.log('Waiting for user to load...');
          return;
        }

        if (!user) {
          console.log('No user found, redirecting...');
          router.push('/sign-in');
          return;
        }

        // VALIDATE QUIZ ID
        if (!quizSessionId || 
            quizSessionId === 'undefined' || 
            quizSessionId === 'null' ||
            quizSessionId.length < 10) {
          console.error('❌ Invalid quiz ID:', quizSessionId);
          setError('Invalid quiz ID');
          setLoading(false);
          return;
        }

        setLoading(true);
        
        const planKey = (user?.publicMetadata?.plan as string) || 'basic';
        console.log('User plan:', planKey);
        
        const hasQuizAccess = planKey === 'intermediate' || planKey === 'pro';
        setHasAccess(hasQuizAccess);
        
        if (!hasQuizAccess) {
          console.log('User does not have quiz access');
          setLoading(false);
          return;
        }

        console.log('Loading quiz:', quizSessionId);
        const result = await getQuizData(quizSessionId);

        console.log('Quiz result:', result);

        if (!result.success) {
          throw new Error(result.error || 'Failed to load quiz');
        }

        setQuizData(result.data);
        
      } catch (err: any) {
        console.error('Error loading quiz:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndLoadQuiz();
  }, [quizSessionId, user, isLoaded, router]);

  const handleQuizCompletion = async (answers: Record<number, string>) => {
    try {
      console.log('Submitting answers:', answers);
      
      const result = await submitQuizAnswers(quizSessionId, answers);
  
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit quiz');
      }
  
      console.log('Quiz submitted:', result);
      
      // Redirect to results page (no query params needed anymore)
      router.push(`/quiz/${quizSessionId}/results`);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

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

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl border border-purple-100">
          <div className="flex justify-center mb-6">
            <div className="size-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Lock size={48} className="text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Quizzes are Premium Only
            </h1>
            <p className="text-slate-600 text-lg mb-6">
              Unlock personalized quizzes and track your progress!
            </p>

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

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center border border-red-100">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Quiz Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'This quiz does not exist.'}</p>
          <button
            onClick={() => router.push('/companion')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800"
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

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
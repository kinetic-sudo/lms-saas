// app/quiz/[quizId]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import InlineQuizComponent from '@/components/InlineQuizzComponent'
import { getQuizData, submitQuizAnswers } from '@/lib/action/quiz.action'
import { Loader2 } from 'lucide-react'

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const quizId = params.quizId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
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

    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

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
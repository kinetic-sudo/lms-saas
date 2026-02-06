'use client'
import React, { useEffect, useState } from 'react'
import InlineQuizComponent from '@/components/InlineQuizzComponent'
// import { generateQuizFromSession } from '@/lib/action/quiz.action' // UNCOMMENT WHEN REAL

const QuizPage = () => {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);

  // MOCK DATA GENERATION (Simulating your backend response)
  useEffect(() => {
    const loadQuiz = async () => {
      // In real app: const res = await generateQuizFromSession(...args);
      
      // Simulating delay
      setTimeout(() => {
        setQuizData({
          summary: [
            "Understood the core difference between for and while loops in Python syntax.",
            "Explored the range() function and how to use it for definite iteration over sequences.",
            "Practiced avoiding infinite loops by implementing proper conditional updates."
          ],
          questions: [
            {
              question_text: "Which keyword is used to stop a loop prematurely?",
              question_order: 1,
              options: [
                { id: "a", text: "stop" },
                { id: "b", text: "break" },
                { id: "c", text: "exit" }
              ]
            },
            {
              question_text: "What does range(5) generate?",
              question_order: 2,
              options: [
                { id: "a", text: "0, 1, 2, 3, 4" },
                { id: "b", text: "1, 2, 3, 4, 5" },
                { id: "c", text: "1, 2, 3, 4" }
              ]
            }
          ]
        });
        setLoading(false);
      }, 1500);
    };
    loadQuiz();
  }, []);

  const handleQuizCompletion = async (answers: any) => {
    console.log("Submitting answers:", answers);
    // Add your submit logic here (e.g., save score to Supabase)
    // router.push('/progress-report');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 md:px-6">
      <InlineQuizComponent 
        summary={quizData.summary}
        questions={quizData.questions}
        onComplete={handleQuizCompletion}
      />
    </div>
  )
}


export default QuizPage;
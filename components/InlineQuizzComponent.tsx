'use client'
import React, { useState } from 'react'
import { CheckCircle2, Sparkles, BookOpen, ArrowRight, RefreshCw } from 'lucide-react'

// Define the types based on your backend structure
interface Option {
  id: string;
  text: string;
}

interface Question {
  question_text: string;
  options: Option[];
  question_order: number;
}

interface InlineQuizProps {
  summary: string[]; // From generateSessionSummary
  questions: Question[]; // From generateQuestionsFromConcepts
  userName?: string;
  onComplete: (answers: any) => void;
}

const InlineQuizComponent = ({ 
  summary = [], 
  questions = [], 
  userName = "Alex",
  onComplete 
}: InlineQuizProps) => {
  // State to track current question index and selected answers
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});

  const currentQuestion = questions[currentQIndex];

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [currentQIndex]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      onComplete(selectedOptions);
    }
  };

  if (!currentQuestion) return <div>Loading quiz...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 font-sans">
      
      {/* 1. Header Section */}
      <div className="text-center space-y-4">
        <span className="inline-block px-4 py-1.5 rounded-full bg-pink-50 text-pink-600 text-xs font-bold tracking-wider uppercase">
          Session Complete
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          Great job, {userName}!
        </h1>
        <p className="text-slate-500 font-medium">
          You've mastered the fundamentals of this topic today.
        </p>
      </div>

      {/* 2. Session Summary Card */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-slate-900" />
          <h2 className="text-lg font-bold text-slate-900">Session Summary</h2>
        </div>
        
        <div className="space-y-6">
          {summary.length > 0 ? summary.map((point, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </span>
              <p className="text-slate-600 leading-relaxed pt-1 font-medium">
                {point}
              </p>
            </div>
          )) : (
            <p className="text-slate-400 italic">No summary available.</p>
          )}
        </div>
      </div>

      {/* 3. Quiz Question Card */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg font-bold text-slate-900">Quick Knowledge Check</h2>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Question {currentQIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 leading-relaxed">
            {currentQuestion.question_text}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptions[currentQIndex] === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                >
                  <span className={`font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                    {option.text}
                  </span>
                  
                  {/* Radio Circle */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-slate-900 border-slate-900' : 'border-slate-200 bg-white'}`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="space-y-3 pt-2">
        <button 
          onClick={handleNext}
          disabled={!selectedOptions[currentQIndex]}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
        >
          {currentQIndex === questions.length - 1 ? 'Finish & Save to Journey' : 'Next Question'}
          <ArrowRight className="w-5 h-5" />
        </button>

        <button className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Retake Session
        </button>
      </div>

    </div>
  )
}

export default InlineQuizComponent
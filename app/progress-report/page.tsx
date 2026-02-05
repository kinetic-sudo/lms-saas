import React from 'react'
import { TrendingUp, Award, Clock, Target, Calendar, ArrowRight } from 'lucide-react'

const ProgressReport = () => {
  // Mock data based on what your DB schema supports
  const stats = [
    { label: 'Current Streak', value: '3 Days', icon: FireIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Quiz Accuracy', value: '85%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Concepts Learned', value: '12', icon: BookIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  const concepts = [
    { name: "Python Loop Syntax", score: 100 },
    { name: "Range Functions", score: 80 },
    { name: "Conditional Logic", score: 60 },
    { name: "Error Handling", score: 40 },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4 md:px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900">Learning Progress</h1>
          <p className="text-slate-500 mt-2">Here's how you're performing in Python Basics.</p>
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

        {/* Main Content Split */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Concept Mastery Section */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Concept Mastery
              </h2>
              <span className="text-sm text-slate-400 font-medium">Based on recent quizzes</span>
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

            <div className="mt-8 pt-6 border-t border-slate-50">
              <button className="text-slate-500 font-semibold hover:text-slate-900 flex items-center gap-2 text-sm transition-colors">
                View detailed analytics <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Icons for the stats array
const FireIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.243-2.143.707-3.071C6.162 13.064 7.275 14.5 8.5 14.5z"/></svg>
)

const BookIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
)

export default ProgressReport
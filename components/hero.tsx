// components/Hero.tsx - NEW COMPONENT
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Users } from 'lucide-react'

export default function Hero() {
  const [currentWord, setCurrentWord] = useState(0)
  const words = ['Master', 'Learn', 'Explore', 'Practice']

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50 py-20 md:py-28">
      {/* Floating background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
            <Sparkles size={16} className="text-purple-600" />
            <span className="text-sm font-bold text-slate-700">AI-Powered Learning</span>
          </div>

          {/* Main Headline with animated word */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="text-slate-900">{words[currentWord]}</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Any Subject
            </span>
            <br />
            <span className="text-slate-900">With AI Companions</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Personalized voice conversations that adapt to your learning style. 
            Build companions for any topic and learn at your own pace.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/companion/new">
              <button className="group bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl hover:shadow-2xl">
                Create Your Companion
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
            </Link>
            <Link href="/companion">
              <button className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-slate-300 transition-all">
                Browse Library
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users size={20} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-slate-900">1000+</p>
                <p className="text-xs text-slate-500 font-bold">Active Learners</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-slate-900">50K+</p>
                <p className="text-xs text-slate-500 font-bold">Sessions Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Add to globals.css

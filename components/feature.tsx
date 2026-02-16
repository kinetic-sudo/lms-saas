// components/Features.tsx - NEW COMPONENT
import { Mic, Brain, Trophy, Clock } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: Mic,
      title: 'Voice-Powered Learning',
      description: 'Natural conversations with AI companions that feel like talking to a real tutor.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Brain,
      title: 'Adaptive AI',
      description: 'Companions that understand your pace and adjust difficulty in real-time.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Trophy,
      title: 'Track Progress',
      description: 'Quizzes, session history, and insights to measure your improvement.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Clock,
      title: 'Learn Anytime',
      description: 'Bite-sized sessions that fit your schedule. 5 minutes or 50 - your choice.',
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-4">
            Why SkillForge?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to master any subject, powered by cutting-edge AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-slate-50 hover:bg-white border-2 border-slate-100 hover:border-slate-200 rounded-3xl p-8 transition-all hover:shadow-xl"
            >
              <div className={`size-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
// components/Testimonials.tsx - NEW COMPONENT
import Image from 'next/image'
import { Star } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Computer Science Student',
      avatar: '👩‍💻',
      rating: 5,
      text: 'The Python companion helped me ace my algorithms course. The voice sessions made complex concepts click instantly!'
    },
    {
      name: 'Marcus Johnson',
      role: 'Language Learner',
      avatar: '🧑‍🎓',
      rating: 5,
      text: 'Learning Spanish has never been this fun. My companion corrects my pronunciation in real-time. Amazing!'
    },
    {
      name: 'Priya Sharma',
      role: 'Data Analyst',
      avatar: '👩‍💼',
      rating: 5,
      text: 'Finally understood statistics! The quizzes after each session really reinforce what I learned.'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-4">
            Loved by Learners Worldwide
          </h2>
          <p className="text-xl text-slate-600">
            Join thousands who've transformed their learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-700 leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-bold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
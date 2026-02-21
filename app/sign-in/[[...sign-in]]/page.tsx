// app/sign-up/[[...sign-up]]/page.tsx
'use client'

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, User, Loader2, Star, ChevronLeft, ChevronRight, Moon } from 'lucide-react'

export default function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false) // NEW STATE
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setIsLoading(true)
    setError('')

    try {
      const result = await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
      }
    } catch (err: any) {
      console.error('Sign-up error:', err)
      setError(err.errors?.[0]?.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithGoogle = async () => {
    if (!isLoaded) return
    
    setIsGoogleLoading(true) // SET LOADING TRUE
    setError('')
    
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: 'api/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err) {
      console.error('Google auth error:', err)
      setError('Failed to sign up with Google')
      setIsGoogleLoading(false) // RESET ON ERROR
    }
    // Note: Don't set loading to false on success because user is redirected
  }

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
    </div>
  )

  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden">
      
      {/* --- LEFT SIDE: Signup Form --- */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-8 lg:px-12 py-10 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          
          <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
              Create Account
            </h1>
            <p className="text-slate-500 text-lg">
              Start your learning journey today.
            </p>
          </div>

          {/* Google Button - WITH LOADER */}
          <button
            onClick={signUpWithGoogle}
            disabled={isGoogleLoading || isLoading} // DISABLE WHEN LOADING
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <Image 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  width={20} 
                  height={20} 
                />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    disabled={isGoogleLoading} // DISABLE WHEN GOOGLE LOADING
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-2xl outline-none transition-all font-medium text-slate-900 disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  disabled={isGoogleLoading}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-2xl outline-none transition-all font-medium text-slate-900 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={isGoogleLoading}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-2xl outline-none transition-all font-medium text-slate-900 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  disabled={isGoogleLoading}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-2xl outline-none transition-all font-medium text-slate-900 disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading} // DISABLE WHEN EITHER LOADING
              className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-bold hover:bg-black active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-xl shadow-slate-900/10 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-bold">
              Already have an account? <Link href="/sign-in" className="text-slate-900 hover:underline">Sign in</Link>
            </p>
            <p className="mt-8 text-xs text-slate-400">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-slate-600">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: Background & Testimonial --- */}
      <div className="relative hidden w-1/2 lg:block h-screen">
        <div className="absolute inset-0 bg-slate-950">
          <Image
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2301&auto=format&fit=crop"
            alt="Office Corridor"
            fill
            className="object-cover opacity-40"
            priority
          />
        </div>

        <div className="absolute top-10 right-10 z-20">
          <div className="p-3 rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md">
            <Moon size={20} />
          </div>
        </div>

        {/* Testimonial Panel */}
        <div className="absolute bottom-50 left-10 right-10 z-20">
          <div className="bg-[#1e232d]/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
            <div className="flex gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={20} className="fill-yellow-500 text-yellow-500" />)}
            </div>

            <blockquote className="text-2xl font-medium text-white/90 leading-relaxed mb-10">
              "Joining SkillForge was the best decision for my career. The platform's layout and quizzes keep me motivated every single day."
            </blockquote>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative size-14 rounded-full overflow-hidden border-2 border-white/20">
                  <Image 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" 
                    alt="User" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div>
                  <div className="font-bold text-white text-xl">Marcus Chen</div>
                  <div className="text-white/50 font-medium">Software Engineer</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all">
                  <ChevronLeft size={22} />
                </button>
                <button className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all">
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
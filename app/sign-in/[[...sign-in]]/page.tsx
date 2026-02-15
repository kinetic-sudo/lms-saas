'use client'

import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, Loader2, Star, ChevronLeft, ChevronRight, Moon, Check } from 'lucide-react'

export default function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!isLoaded) return
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (err) {
      setError('Failed to sign in with Google')
    }
  }

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
    </div>
  )

  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden">
      
      {/* --- LEFT SIDE: Login Form --- */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-8 lg:px-12">
        <div className="w-full max-w-[420px]">
          {/* Header / Logo */}
          {/* <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center gap-2.5 justify-center mb-4 opacity-90 hover:opacity-100 transition-opacity">
              <Image 
                src="/images/logo.svg"
                alt="SkillForge" 
                width={48}
                height={48}           
              />
              <span className="font-bold text-2xl tracking-tight">SkillForge</span>
            </div>
          </Link>
          
        </div> */}

          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-lg">
              Sign in to continue your learning journey.
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
          >
            <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-2xl outline-none transition-all font-medium text-slate-900"
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
                    placeholder="Enter your password"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-2xl outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-slate-900 border-slate-900' : 'border-slate-200 bg-white'}`}>
                  {rememberMe && <Check size={12} className="text-white" strokeWidth={4} />}
                  <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                </div>
                <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Remember me</span>
              </label>
              <Link href="#" className="text-sm font-bold text-slate-900 hover:underline">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-bold hover:bg-black active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-lg shadow-xl shadow-slate-900/10"
            >
              {isLoading ? <Loader2 className="animate-spin" size={22} /> : <>Sign in <ChevronRight size={20} /></>}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 font-bold">
              Don't have an account? <Link href="/sign-up" className="text-slate-900 hover:underline">Sign up</Link>
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

        {/* Dark theme toggle mockup */}
        <div className="absolute top-10 right-10 z-20">
          <div className="p-3 rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-md">
            <Moon size={20} />
          </div>
        </div>

        {/* Fixed Testimonial matching Screenshot 2 */}
        <div className="absolute bottom-40 left-10 right-10 z-20">
          <div className="bg-[#1e232d]/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
            <div className="flex gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={20} className="fill-yellow-500 text-yellow-500" />)}
            </div>

            <blockquote className="text-2xl font-medium text-white/90 leading-relaxed mb-10">
              "SkillForge transformed the way I approach learning. The community and the resources available are truly world-class."
            </blockquote>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative size-14 rounded-full overflow-hidden border-2 border-white/20">
                  <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" alt="Elena" fill className="object-cover" />
                </div>
                <div>
                  <div className="font-bold text-white text-xl">Elena Rodriguez</div>
                  <div className="text-white/50 font-medium">Product Design Student</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"><ChevronLeft size={22} /></button>
                <button className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"><ChevronRight size={22} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
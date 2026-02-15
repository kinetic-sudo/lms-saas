// app/sso-callback/page.tsx
'use client'

import { useClerk } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk()
  const router = useRouter()

  useEffect(() => {
    const complete = async () => {
      try {
        await handleRedirectCallback()
        router.push('/')
      } catch (error) {
        console.error('SSO error:', error)
        router.push('/sign-in')
      }
    }
    complete()
  }, [handleRedirectCallback, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Loader2 className="h-12 w-12 animate-spin text-black mb-4" />
      <p className="text-slate-600 font-medium">Completing sign in...</p>
    </div>
  )
}
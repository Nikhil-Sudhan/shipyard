'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // no-op; could check session
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithEmail = async () => {
    const email = prompt('enter your email for a magic link')
    if (!email) return
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    alert('magic link sent! check your email')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">sign in</h1>
        <Button onClick={signInWithGoogle} className="w-64">continue with google</Button>
        <Button variant="outline" onClick={signInWithEmail} className="w-64">send magic link</Button>
      </div>
    </div>
  )
}








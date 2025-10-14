'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const next = url.searchParams.get('next')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Auth error:', error)
            router.replace('/auth')
            return
          }

          // If this is a password reset flow, Supabase sets a recovery type
          const { data } = await supabase.auth.getSession()
          const isRecovery = data.session?.user?.email_confirmed_at === null &&
            (data.session?.user?.user_metadata?.email_change_token_current ||
             data.session?.user?.user_metadata?.recovery_token)

          if (isRecovery) {
            router.replace('/auth/reset')
            return
          }

          // After sign-in, route based on profile existence
          const {
            data: { user }
          } = await supabase.auth.getUser()

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .single()

            if (!profile) {
              router.replace('/onboarding')
              return
            }
          }

          router.replace(next || '/me')
          return
        }

        // No code present, go to auth page
        router.replace('/auth')
      } catch (error) {
        console.error('Callback error:', error)
        router.replace('/auth')
      }
    }

    run()
  }, [router])

  return null
}



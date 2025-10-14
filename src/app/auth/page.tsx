'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthPage() {
  const router = useRouter()
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` : undefined)

  // Check if user is already authenticated
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Check if user has a profile
      const checkProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          router.push('/')
        } else {
          router.push('/onboarding')
        }
      }
      
      checkProfile()
    }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md glass card-hover">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">welcome to shipyard</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#404040',
                    brandAccent: '#525252',
                    inputBackground: '#1f1f1f',
                    inputBorder: '#404040',
                    inputText: '#e5e5e5',
                    inputLabelText: '#e5e5e5',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                },
              },
              style: {
                button: {
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 15px',
                  transition: 'all 0.2s ease-in-out',
                },
                input: {
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                  padding: '10px 15px',
                },
                anchor: {
                  color: '#e5e5e5',
                  textDecoration: 'none',
                },
                message: {
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                  padding: '10px 15px',
                },
              },
            }}
            theme="dark"
            providers={['google']}
            redirectTo={redirectTo}
            magicLink={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
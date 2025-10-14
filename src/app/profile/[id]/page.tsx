'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, MapPin, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  display_name: string
  location_city: string | null
  location_country: string | null
  interests: string[] | null
  primary_photo_url: string | null
  extra_photo_urls: string[] | null
  summary_intro: string[] | null
  summary_outro: string | null
}

export default function ProfilePage() {
  const params = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStartingChat, setIsStartingChat] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProfile()
    }
  }, [params.id])

  const handleStartChat = async () => {
    if (!profile) return
    
    setIsStartingChat(true)
    try {
      console.log('🔍 Starting chat with user:', profile.id)
      
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      
      if (!accessToken) {
        console.error('❌ No access token found - user not authenticated')
        alert('Please sign in to start a chat')
        return
      }
      
      const authHeaders: Record<string, string> = { Authorization: `Bearer ${accessToken}` }
      
      console.log('📤 Sending conversation request...')
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ otherUserId: profile.id })
      })

      console.log('📥 Conversation response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const conversation = await response.json()
        console.log('✅ Conversation created:', conversation)
        window.location.href = `/chat/${conversation.id}`
      } else {
        let errorData
        try {
          errorData = await response.json()
          console.error('❌ Failed to start conversation - API Error:', errorData)
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          const textResponse = await response.text()
          console.error('❌ Raw response text:', textResponse)
          errorData = { error: `HTTP ${response.status}: ${textResponse}` }
        }
        
        console.error('❌ Full error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        })
        
        alert(`Failed to start conversation: ${errorData.error || `HTTP ${response.status}`}`)
      }
    } catch (error) {
      console.error('❌ Error starting chat:', error)
      alert(`Error starting chat: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsStartingChat(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">profile not found</h1>
          <p className="text-muted-foreground">this person might have deleted their profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card className="glass">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.primary_photo_url || ''} />
                      <AvatarFallback className="text-2xl">
                        {profile.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        {profile.display_name || 'Anonymous'}
                      </h1>
                      
                      {(profile.location_city || profile.location_country) && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <MapPin className="h-5 w-5" />
                          <span>
                            {[profile.location_city, profile.location_country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {profile.interests && profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((interest, index) => (
                            <Badge key={index} variant="secondary">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              {profile.summary_intro && profile.summary_intro.length > 0 && (
                <Card className="glass">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {profile.summary_intro.map((paragraph, index) => (
                        <p key={index} className="text-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                      {profile.summary_outro && (
                        <p className="text-foreground font-medium">
                          {profile.summary_outro}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Photo Gallery */}
              {profile.extra_photo_urls && profile.extra_photo_urls.length > 0 && (
                <Card className="glass">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      photos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {profile.extra_photo_urls.map((url, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={url} 
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="glass">
                <CardContent className="p-6">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {isStartingChat ? 'starting chat...' : 'start chat'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">quick stats</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">member since</span>
                      <span className="text-foreground">recently</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">location</span>
                      <span className="text-foreground">
                        {profile.location_city || 'unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">interests</span>
                      <span className="text-foreground">
                        {profile.interests?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



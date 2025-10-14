'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Save, X, MapPin, Camera, AlertCircle, Loader2 } from 'lucide-react'
import { logger, handleApiResponse } from '@/lib/debug-utils'

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

export default function MePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    summary_intro: [] as string[],
    summary_outro: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNewProfile, setIsNewProfile] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setError(null)
      try {
        logger.info('Fetching user profile')
        const response = await handleApiResponse(
          await fetch('/api/profile')
        )
        
        if (response.success && response.data) {
          logger.info('Profile loaded successfully')
          setProfile(response.data)
          setEditData({
            summary_intro: response.data.summary_intro || [],
            summary_outro: response.data.summary_outro || ''
          })
          
          // Check if this is a new profile (from URL params)
          const urlParams = new URLSearchParams(window.location.search)
          if (urlParams.get('new') === 'true') {
            setIsNewProfile(true)
          }
        } else {
          logger.error('Failed to load profile', { error: response.error })
          setError('Failed to load profile: ' + (response.error || 'Unknown error'))
        }
      } catch (error) {
        logger.error('Failed to fetch profile:', error)
        setError('An unexpected error occurred while loading your profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary_intro: editData.summary_intro,
          summary_outro: editData.summary_outro
        })
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      summary_intro: profile?.summary_intro || [],
      summary_outro: profile?.summary_outro || ''
    })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">loading your profile...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-card rounded-lg border border-border">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">profile not found</h1>
          <p className="text-muted-foreground">please complete your onboarding first</p>
          <Button className="mt-4" onClick={() => window.location.href = '/onboarding'}>
            complete setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">shipyard</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                Home
              </Button>
              <Button variant="ghost" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-8">
        {isNewProfile && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-primary/10 text-primary rounded-md flex items-center gap-2">
            <div>
              <p className="font-medium">Welcome to Shipyard! 🎉</p>
              <p className="text-sm">Your profile has been created successfully. You can now explore the platform and connect with others.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsNewProfile(false)}>Dismiss</Button>
          </div>
        )}
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
              <Card className="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>about me</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'cancel' : 'edit'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {isEditing ? (
                    <div className="space-y-4">
                      {editData.summary_intro.map((paragraph, index) => (
                        <Textarea
                          key={index}
                          value={paragraph}
                          onChange={(e) => {
                            const newIntro = [...editData.summary_intro]
                            newIntro[index] = e.target.value
                            setEditData(prev => ({ ...prev, summary_intro: newIntro }))
                          }}
                          className="bg-card border-border"
                          rows={3}
                        />
                      ))}
                      <Textarea
                        value={editData.summary_outro}
                        onChange={(e) => setEditData(prev => ({ ...prev, summary_outro: e.target.value }))}
                        placeholder="outro line..."
                        className="bg-card border-border"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={isSaving} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'saving...' : 'save'}
                        </Button>
                        <Button variant="outline" onClick={handleCancel} size="sm">
                          <X className="h-4 w-4 mr-2" />
                          cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.summary_intro && profile.summary_intro.map((paragraph, index) => (
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
                  )}
                </CardContent>
              </Card>

              {/* Photo Gallery */}
              {profile.extra_photo_urls && profile.extra_photo_urls.length > 0 && (
                <Card className="glass">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      my photos
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
                  <h3 className="font-semibold text-foreground mb-4">profile stats</h3>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">photos</span>
                      <span className="text-foreground">
                        {(profile.extra_photo_urls?.length || 0) + 1}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-6">
                  <Button variant="outline" className="w-full">
                    edit photos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



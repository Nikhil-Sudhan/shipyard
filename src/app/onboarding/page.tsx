'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { logger, handleApiResponse } from '@/lib/debug-utils'
import { supabase } from '@/lib/supabase'

const GEN_Z_QUESTIONS = [
  {
    key: 'vibe_check',
    question: 'what\'s your main vibe?',
    placeholder: 'chill, chaotic, mysterious, etc.'
  },
  {
    key: 'dream_project',
    question: 'what\'s your dream project?',
    placeholder: 'building the next big thing, creating art, etc.'
  },
  {
    key: 'coffee_order',
    question: 'what\'s your go-to coffee order?',
    placeholder: 'iced oat milk latte, black coffee, etc.'
  },
  {
    key: 'weekend_activity',
    question: 'perfect weekend activity?',
    placeholder: 'coding, hiking, brunch, etc.'
  },
  {
    key: 'life_goal',
    question: 'what\'s your biggest life goal?',
    placeholder: 'start a company, travel the world, etc.'
  }
]

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    display_name: '',
    location_city: '',
    location_country: '',
    interests: [] as string[],
    primary_photo: null as File | null,
    extra_photos: [] as File[],
    answers: {} as Record<string, string>
  })
  const [interestInput, setInterestInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setIsAuthenticated(true)
        } else {
          setError('You must be signed in to complete onboarding')
          // Redirect to auth page after a short delay
          setTimeout(() => {
            window.location.href = '/auth?redirectTo=/onboarding'
          }, 2000)
        }
      } catch (err) {
        setError('Failed to check authentication status')
        logger.error('Auth check error:', err)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  const handleInterestAdd = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }))
      setInterestInput('')
    }
  }

  const handleInterestRemove = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }))
  }

  const handlePhotoUpload = (file: File, isPrimary = false) => {
    if (isPrimary) {
      setFormData(prev => ({ ...prev, primary_photo: file }))
    } else if (formData.extra_photos.length < 3) {
      setFormData(prev => ({ ...prev, extra_photos: [...prev.extra_photos, file] }))
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    // Check authentication again before submission
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setError('Your session has expired. Please sign in again.')
      setTimeout(() => {
        window.location.href = '/auth?redirectTo=/onboarding'
      }, 2000)
      setIsSubmitting(false)
      return
    }
    
    try {
      logger.info('Starting onboarding submission process')
      
      // 1) Save answers
      logger.info('Step 1: Saving profile answers')
      const accessToken = data.session?.access_token
      const authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

      const answersResponse = await handleApiResponse(
        await fetch('/api/profile/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ answers: formData.answers })
        })
      )
      
      if (!answersResponse.success) {
        throw new Error(`Failed to save answers: ${answersResponse.error}`)
      }
      
      // 2) Generate summary using OpenAI
      logger.info('Step 2: Generating profile summary with OpenAI')
      const summaryResponse = await handleApiResponse(
        await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            answers: formData.answers,
            interests: formData.interests
          })
        })
      )
      
      if (!summaryResponse.success || !summaryResponse.data) {
        throw new Error(`Failed to generate summary: ${summaryResponse.error}`)
      }
      
      const summary = summaryResponse.data as { intro: string[]; outro: string }
      logger.info('Summary generated successfully', { summary })

      // 3) Upload photos
      const upload = async (file: File, path: string): Promise<string> => {
        logger.info(`Uploading photo: ${path}`)
        const fd = new FormData()
        fd.append('file', file)
        fd.append('path', path)
        
        const uploadResponse = await handleApiResponse<{url: string}>(
          await fetch('/api/storage/upload', { method: 'POST', headers: authHeaders, body: fd })
        )
        
        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error(`Failed to upload photo: ${uploadResponse.error}`)
        }
        
        return uploadResponse.data.url
      }

      let primaryUrl: string | null = null
      if (formData.primary_photo) {
        primaryUrl = await upload(formData.primary_photo, `primary-${Date.now()}.jpg`)
        logger.info('Primary photo uploaded successfully', { primaryUrl })
      }
      
      const extraUrls: string[] = []
      for (const file of formData.extra_photos) {
        const url = await upload(file, `extra-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`)
        extraUrls.push(url)
      }
      
      if (extraUrls.length > 0) {
        logger.info(`${extraUrls.length} extra photos uploaded successfully`)
      }

      // 4) Save profile
      logger.info('Step 4: Saving complete profile')
      const profileData = {
        display_name: formData.display_name,
        location_city: formData.location_city,
        location_country: formData.location_country,
        interests: formData.interests,
        summary_intro: summary.intro,
        summary_outro: summary.outro,
        primary_photo_url: primaryUrl,
        extra_photo_urls: extraUrls
      }
      
      const profileResponse = await handleApiResponse(
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(profileData)
        })
      )

      if (!profileResponse.success) {
        throw new Error(`Failed to save profile: ${profileResponse.error}`)
      }
      
      logger.info('Onboarding completed successfully')
      // Redirect to the me page with a query parameter to show welcome message
      window.location.href = '/me?new=true'
    } catch (error) {
      logger.error('Onboarding error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!isAuthenticated && !isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-card rounded-lg border border-border">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">You need to sign in before completing your profile</p>
          <p className="text-muted-foreground mb-4">Redirecting to sign in page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">welcome to shipyard</h1>
          <p className="text-muted-foreground">let&apos;s set up your profile</p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>tell us about yourself</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  display name
                </label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="what should we call you?"
                  className="bg-card border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    city
                  </label>
                  <Input
                    value={formData.location_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
                    placeholder="where are you?"
                    className="bg-card border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    country
                  </label>
                  <Input
                    value={formData.location_country}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_country: e.target.value }))}
                    placeholder="country"
                    className="bg-card border-border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  interests
                </label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="add an interest..."
                    className="bg-card border-border"
                    onKeyPress={(e) => e.key === 'Enter' && handleInterestAdd()}
                  />
                  <Button onClick={handleInterestAdd} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {interest}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleInterestRemove(interest)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!formData.display_name}
              >
                next: add photos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>add some photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  profile photo
                </label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.primary_photo ? URL.createObjectURL(formData.primary_photo) : ''} />
                    <AvatarFallback>
                      <Upload className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], true)}
                      className="hidden"
                      id="primary-photo"
                    />
                    <Button asChild size="sm">
                      <label htmlFor="primary-photo" className="cursor-pointer">
                        upload photo
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  extra photos (up to 3)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      {formData.extra_photos[i - 1] ? (
                        <img 
                          src={URL.createObjectURL(formData.extra_photos[i - 1])} 
                          alt={`Extra photo ${i}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                            className="hidden"
                            id={`extra-photo-${i}`}
                          />
                          <label htmlFor={`extra-photo-${i}`} className="text-sm text-muted-foreground cursor-pointer">
                            add photo
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  next: answer questions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Questions */}
        {step === 3 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>quick vibe check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {GEN_Z_QUESTIONS.map((q) => (
                <div key={q.key}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {q.question}
                  </label>
                  <Textarea
                    value={formData.answers[q.key] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      answers: { ...prev.answers, [q.key]: e.target.value }
                    }))}
                    placeholder={q.placeholder}
                    className="bg-card border-border"
                    rows={2}
                  />
                </div>
              ))}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'creating profile...' : 'finish setup'}
                </Button>
                
                {error && (
                  <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

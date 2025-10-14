'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  display_name: string
  primary_photo_url: string
  location_city: string
  location_country: string
  interests: string[]
}

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return
    
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔍 Searching for:', query)
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      console.log('📥 Search response:', data)
      
      if (data.error) {
        console.error('❌ Search API error:', data.error, data.details)
        setMessage(`error: ${data.error}. check console for details.`)
        setResults([])
        return
      }
      
      setResults(data.profiles || [])
      
      // Generate a simple response message
      if (data.profiles?.length > 0) {
        setMessage(`okay, here's who i found for "${query}"...`)
      } else {
        setMessage(`hmm, couldn't find anyone for "${query}". try something else?`)
      }
    } catch (error) {
      console.error('❌ Search error:', error)
      setMessage('oops, something went wrong with the search. check console for details.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-3xl mx-auto w-full">
        {!message ? (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">find your people</h1>
            <p className="text-muted-foreground">
              search for interests, skills, or locations to connect with like-minded gen-z creators
            </p>
          </div>
        ) : (
          <div className="w-full mb-8 mt-4">
            <p className="text-xl">{message}</p>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {results.map((profile) => (
              <Card key={profile.id} className="glass card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-border">
                      <img 
                        src={profile.primary_photo_url || 'https://via.placeholder.com/150'} 
                        alt={profile.display_name || 'User'}
                      />
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{profile.display_name}</h3>
                      {(profile.location_city || profile.location_country) && (
                        <p className="text-sm text-muted-foreground">
                          {[profile.location_city, profile.location_country].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.interests?.slice(0, 3).map((interest, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {profile.interests?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/profile/${profile.id}`)}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <div className="sticky bottom-0 w-full bg-background/80 backdrop-blur-md border-t border-border p-4">
        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
          <Input
            type="text"
            placeholder="find someone who can..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : <Search className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
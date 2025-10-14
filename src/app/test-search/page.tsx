'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function TestSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Load all profiles and current user on mount
  useEffect(() => {
    loadAllProfiles()
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      console.log('Current user:', user)
    } catch (err) {
      console.error('Error getting current user:', err)
    }
  }

  const loadAllProfiles = async () => {
    try {
      const response = await fetch('/api/search')
      const data = await response.json()
      setAllProfiles(data.profiles || [])
      console.log('All profiles loaded:', data.profiles)
    } catch (err) {
      console.error('Error loading profiles:', err)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError('')
    
    try {
      console.log('Searching for:', query)
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        setResults([])
      } else {
        setResults(data.profiles || [])
        console.log('Search results:', data.profiles)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">🔍 Search Testing Page</h1>

      {/* Current User Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current User Info</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div className="space-y-2">
              <div><strong>User ID:</strong> {currentUser.id}</div>
              <div><strong>Email:</strong> {currentUser.email}</div>
              <div><strong>Name:</strong> {currentUser.user_metadata?.full_name || 'N/A'}</div>
            </div>
          ) : (
            <div className="text-yellow-600">Not signed in</div>
          )}
        </CardContent>
      </Card>

      {/* All Profiles Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>All Profiles in Database ({allProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allProfiles.length === 0 ? (
            <div className="text-yellow-600 bg-yellow-50 p-4 rounded">
              ⚠️ No profiles found! Create profiles via onboarding first.
            </div>
          ) : (
            <div className="space-y-4">
              {allProfiles.map((profile) => (
                <div key={profile.id} className="border p-4 rounded">
                  <div className="font-bold">{profile.display_name || 'No name'}</div>
                  <div className="text-sm text-gray-600">
                    📍 {profile.location_city}, {profile.location_country}
                  </div>
                  <div className="text-sm mt-2">
                    <strong>Interests:</strong> {profile.interests?.join(', ') || 'None'}
                  </div>
                  <div className="text-sm mt-1">
                    <strong>Summary:</strong> {profile.summary_intro?.join(' ') || 'None'}
                  </div>
                  <div className="text-sm mt-1">
                    <strong>Profile ID:</strong> {profile.id}
                    {currentUser && profile.id === currentUser.id && (
                      <span className="ml-2 text-green-600 font-bold">← THIS IS YOU!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter search keywords (e.g., your name, interests)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div>💡 <strong>Test queries:</strong></div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => { setQuery('drones'); handleSearch(); }}>
                drones
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setQuery('computer'); handleSearch(); }}>
                computer
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setQuery('drones computer'); handleSearch(); }}>
                drones computer
              </Button>
              {allProfiles[0]?.display_name && (
                <Button variant="outline" size="sm" onClick={() => { setQuery(allProfiles[0].display_name); handleSearch(); }}>
                  {allProfiles[0].display_name}
                </Button>
              )}
              {currentUser && (
                <Button variant="outline" size="sm" onClick={() => { setQuery(currentUser.user_metadata?.full_name || 'test'); handleSearch(); }}>
                  Search for yourself
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-600 bg-red-50 p-4 rounded">
              ❌ Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {query && (
        <Card>
          <CardHeader>
            <CardTitle>
              Search Results for &quot;{query}&quot; ({results.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-gray-500 p-4">
                No profiles found matching &quot;{query}&quot;
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((profile) => (
                  <div key={profile.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="font-bold">{profile.display_name}</div>
                    <div className="text-sm text-gray-600">
                      📍 {profile.location_city}, {profile.location_country}
                    </div>
                    <div className="text-sm mt-2">
                      <strong>Interests:</strong> {profile.interests?.join(', ') || 'None'}
                    </div>
                    <div className="text-sm mt-1">
                      <strong>Profile ID:</strong> {profile.id}
                      {currentUser && profile.id === currentUser.id && (
                        <span className="ml-2 text-green-600 font-bold">← THIS IS YOU!</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card className="mt-8 bg-gray-50">
        <CardHeader>
          <CardTitle>🛠️ Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>✅ Check your browser console (F12) for detailed logs</div>
          <div>✅ Check your terminal for server-side logs</div>
          <div>✅ Search is performed in Supabase PostgreSQL database</div>
          <div>✅ Search fields: display_name, interests, summary_intro</div>
          <div>✅ Multiple keywords use OR logic (finds ANY match)</div>
          <div>✅ You should be able to search for your own profile</div>
        </CardContent>
      </Card>
    </div>
  )
}
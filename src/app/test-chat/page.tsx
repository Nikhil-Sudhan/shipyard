'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function TestChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    getCurrentUser()
    loadProfiles()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      addLog(`Current user: ${user ? user.id : 'Not signed in'}`)
    } catch (err) {
      addLog(`Error getting user: ${err}`)
    }
  }

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/search')
      const data = await response.json()
      setProfiles(data.profiles || [])
      addLog(`Loaded ${data.profiles?.length || 0} profiles`)
    } catch (err) {
      addLog(`Error loading profiles: ${err}`)
    }
  }

  const testConversationAPI = async (otherUserId: string) => {
    if (!currentUser) {
      addLog('❌ No current user - please sign in')
      return
    }

    setLoading(true)
    addLog(`🧪 Testing conversation creation with user: ${otherUserId}`)

    try {
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      
      if (!accessToken) {
        addLog('❌ No access token found')
        return
      }

      addLog(`🔑 Access token: ${accessToken.substring(0, 20)}...`)

      const authHeaders = { Authorization: `Bearer ${accessToken}` }
      
      addLog('📤 Sending conversation request...')
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ otherUserId })
      })

      addLog(`📥 Response status: ${response.status}`)
      addLog(`📥 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)

      if (response.ok) {
        const conversation = await response.json()
        addLog(`✅ Conversation created successfully: ${JSON.stringify(conversation)}`)
      } else {
        let errorData
        try {
          errorData = await response.json()
          addLog(`❌ API Error: ${JSON.stringify(errorData)}`)
        } catch (parseError) {
          const textResponse = await response.text()
          addLog(`❌ Raw error response: ${textResponse}`)
          errorData = { error: `HTTP ${response.status}: ${textResponse}` }
        }
        
        addLog(`❌ Full error: ${JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        })}`)
      }
    } catch (error) {
      addLog(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">💬 Chat API Test Page</h1>

      {/* Current User */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div>
              <div><strong>ID:</strong> {currentUser.id}</div>
              <div><strong>Email:</strong> {currentUser.email}</div>
            </div>
          ) : (
            <div className="text-red-600">Not signed in</div>
          )}
        </CardContent>
      </Card>

      {/* Profiles */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Profiles ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-bold">{profile.display_name || 'No name'}</div>
                  <div className="text-sm text-gray-600">ID: {profile.id}</div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => testConversationAPI(profile.id)}
                  disabled={loading || !currentUser || profile.id === currentUser.id}
                >
                  Test Chat
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click "Test Chat" to start testing.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => setLogs([])}
          >
            Clear Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

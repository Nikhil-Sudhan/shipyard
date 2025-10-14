'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender: {
    display_name: string
    primary_photo_url: string | null
  }
}

interface Conversation {
  id: string
  participants: Array<{
    id: string
    display_name: string
    primary_photo_url: string | null
  }>
}

export default function ChatPage() {
  const params = useParams()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/${params.conversationId}`)
        if (response.ok) {
          const data = await response.json()
          setConversation(data)
        }
      } catch (error) {
        console.error('Failed to fetch conversation:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.conversationId) {
      fetchConversation()
    }
  }, [params.conversationId])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${params.conversationId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    if (params.conversationId) {
      fetchMessages()
    }
  }, [params.conversationId])

  useEffect(() => {
    if (!params.conversationId) return

    const channel = supabase
      .channel(`conversation:${params.conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${params.conversationId}`
      }, (payload: {
        new: {
          id: string
          content: string
          sender_id: string
          created_at: string
        }
      }) => {
        const row = payload.new
        setMessages(prev => ([...prev, {
          id: row.id,
          content: row.content,
          sender_id: row.sender_id,
          created_at: row.created_at,
          sender: { display_name: 'someone', primary_photo_url: null }
        }]))
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
          }
        }, 50)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.conversationId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !params.conversationId) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch(`/api/conversations/${params.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      })

      if (response.ok) {
        // optimistic handled by realtime
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">conversation not found</h1>
          <p className="text-muted-foreground">this chat might have been deleted</p>
        </div>
      </div>
    )
  }

  const otherParticipant = conversation.participants[0]

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="lg:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParticipant.primary_photo_url || ''} />
            <AvatarFallback>
              {otherParticipant.display_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-semibold text-foreground">
              {otherParticipant.display_name}
            </h2>
            <p className="text-sm text-muted-foreground">online</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">no messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender_id !== currentUserId && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.primary_photo_url || ''} />
                    <AvatarFallback>
                      {message.sender.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="type a message..."
            className="flex-1 bg-card border-border"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

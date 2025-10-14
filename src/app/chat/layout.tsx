'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Menu, MessageCircle, LogOut } from 'lucide-react'
import AuthButton from '@/components/auth-button'
import { supabase } from '@/lib/supabase'

interface Chat {
  id: string
  participant: {
    id: string
    display_name: string
    primary_photo_url: string | null
  }
  lastMessage?: {
    content: string
    created_at: string
  } | null
  unreadCount: number
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const accessToken = data.session?.access_token
        const authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        const res = await fetch('/api/conversations', { headers: authHeaders })
        if (res.ok) {
          const data = await res.json()
          setChats(data)
        }
      } catch {}
    }
    load()
  }, [])

  const onSelectChat = (id: string) => {
    router.push(`/chat/${id}`)
    setIsOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <ChatSidebar chats={chats} onSelectChat={onSelectChat} />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-xl font-bold text-foreground">shipyard</h1>
          
          <AuthButton />
        </div>
      </header>

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 border-r border-border bg-card/50 backdrop-blur-sm">
          <ChatSidebar chats={chats} onSelectChat={onSelectChat} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}

function ChatSidebar({ chats, onSelectChat }: { chats: Chat[]; onSelectChat: (id: string) => void }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">shipyard</h1>
        <p className="text-sm text-muted-foreground">find your people</p>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">no conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                start chatting with someone!
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelectChat(chat.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={chat.participant?.primary_photo_url || ''} />
                  <AvatarFallback>
                    {chat.participant?.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground truncate">
                      {chat.participant?.display_name || 'unknown'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/'
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          sign out
        </Button>
      </div>
    </div>
  )
}

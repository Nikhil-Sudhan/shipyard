import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientWithAccessToken } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null
    const supabase = bearer ? createClientWithAccessToken(bearer) : await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversation with participants
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        conversation_participants!inner(
          user_id,
          profiles!conversation_participants_user_id_fkey(
            id,
            display_name,
            primary_photo_url
          )
        )
      `)
      .eq('id', params.conversationId)
      .eq('conversation_participants.user_id', user.id)
      .single()

    if (error) {
      console.error('Conversation fetch error:', error)
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Transform the data to match our interface
    const transformedConversation = {
      id: conversation.id,
      created_at: conversation.created_at,
      participants: conversation.conversation_participants.map((cp: {
        profiles: {
          id: string
          display_name: string
          primary_photo_url: string | null
        }
      }) => cp.profiles)
    }

    return NextResponse.json(transformedConversation)
  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

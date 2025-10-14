import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientWithAccessToken } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { otherUserId } = body

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 })
    }

    if (otherUserId === user.id) {
      return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 })
    }

    // Check if conversation already exists between these users
    const { data: existingConversation, error: existingError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner(
          id,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .in('conversation_id', 
        supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
      )

    if (existingError) {
      console.error('Existing conversation check error:', existingError)
    }

    if (existingConversation && existingConversation.length > 0) {
      // Return existing conversation
      return NextResponse.json({
        id: existingConversation[0].conversations.id,
        created_at: existingConversation[0].conversations.created_at
      })
    }

    // Create new conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single()

    if (conversationError) {
      console.error('Conversation creation error:', conversationError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Add both users as participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: user.id },
        { conversation_id: conversation.id, user_id: otherUserId }
      ])

    if (participantsError) {
      console.error('Participants creation error:', participantsError)
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    // Get conversations where current user participates
    const { data: participantRows, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (participantsError) {
      console.error('Participants fetch error:', participantsError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    const conversationIds = (participantRows || []).map(r => r.conversation_id)
    if (conversationIds.length === 0) {
      return NextResponse.json([])
    }

    // For each conversation, fetch the other participant and last message
    const conversations: Array<{
      id: string
      participant: {
        id: string
        display_name: string
        primary_photo_url: string | null
      } | null
      lastMessage: {
        content: string
        created_at: string
      } | null
      unreadCount: number
    }> = []

    for (const cid of conversationIds) {
      const { data: others } = await supabase
        .from('conversation_participants')
        .select('profiles!inner(id, display_name, primary_photo_url)')
        .eq('conversation_id', cid)
        .neq('user_id', user.id)

      const other = others?.[0]?.profiles

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at')
        .eq('conversation_id', cid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      conversations.push({
        id: cid,
        participant: other,
        lastMessage: lastMsg || null,
        unreadCount: 0
      })
    }

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Conversations list API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

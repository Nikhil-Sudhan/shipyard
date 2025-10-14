import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientWithAccessToken } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params
    const authHeader = request.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null
    const supabase = bearer ? createClientWithAccessToken(bearer) : await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Get messages with sender info
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        created_at,
        profiles!messages_sender_id_fkey(
          display_name,
          primary_photo_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Messages fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Transform the data
    const transformedMessages = messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.sender_id,
      created_at: msg.created_at,
      sender: msg.profiles
    }))

    return NextResponse.json(transformedMessages)
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params
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
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify user is participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })
      .select(`
        id,
        content,
        sender_id,
        created_at,
        profiles!messages_sender_id_fkey(
          display_name,
          primary_photo_url
        )
      `)
      .single()

    if (error) {
      console.error('Message create error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Transform the data
    const transformedMessage = {
      id: message.id,
      content: message.content,
      sender_id: message.sender_id,
      created_at: message.created_at,
      sender: message.profiles
    }

    return NextResponse.json(transformedMessage)
  } catch (error) {
    console.error('Message API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

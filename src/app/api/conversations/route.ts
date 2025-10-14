import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientWithAccessToken } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Conversation creation request received')
    
    const authHeader = request.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null
    
    console.log('🔑 Auth header present:', !!authHeader)
    console.log('🔑 Bearer token present:', !!bearer)
    
    const supabase = bearer ? createClientWithAccessToken(bearer) : await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Test database connectivity first
    console.log('🔍 Testing database connectivity...')
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connectivity test failed:', testError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError.message 
      }, { status: 500 })
    }
    console.log('✅ Database connectivity test passed')

    const body = await request.json()
    const { otherUserId } = body

    console.log('👤 Other user ID:', otherUserId)

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 })
    }

    if (otherUserId === user.id) {
      return NextResponse.json({ error: 'Cannot start conversation with yourself' }, { status: 400 })
    }

    // Step 1: fetch all conversation ids for the current user
    console.log('🔍 Checking existing conversations for user:', user.id)
    const { data: myParticipantRows, error: myParticipantsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (myParticipantsError) {
      console.error('❌ Existing conversation check error (my conversations):', myParticipantsError)
      console.error('❌ Error details:', {
        code: myParticipantsError.code,
        message: myParticipantsError.message,
        details: myParticipantsError.details,
        hint: myParticipantsError.hint
      })
      return NextResponse.json({ 
        error: 'Failed to check conversations', 
        details: myParticipantsError.message 
      }, { status: 500 })
    }

    console.log('✅ Found existing conversations:', myParticipantRows?.length || 0)

    const myConversationIds = (myParticipantRows || []).map(r => r.conversation_id)

    // Step 2: see if the other user is in any of those conversations
    if (myConversationIds.length > 0) {
      const { data: existingWithOther, error: existingError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConversationIds)

      if (existingError) {
        console.error('Existing conversation check error (other in my conversations):', existingError)
        return NextResponse.json({ error: 'Failed to check conversations' }, { status: 500 })
      }

      if (existingWithOther && existingWithOther.length > 0) {
        return NextResponse.json({ id: existingWithOther[0].conversation_id })
      }
    }

    // Create new conversation
    console.log('💬 Creating new conversation...')
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single()

    if (conversationError) {
      console.error('❌ Conversation creation error:', conversationError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    console.log('✅ Conversation created:', conversation.id)

    // Add current user as participant first (passes RLS)
    console.log('👤 Adding current user as participant...')
    const { error: addSelfError } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: conversation.id, user_id: user.id })

    if (addSelfError) {
      console.error('❌ Failed adding current user as participant:', addSelfError)
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
    }

    console.log('✅ Current user added as participant')

    // Then add the other user (policy allows adding others if you are a participant)
    console.log('👥 Adding other user as participant...')
    const { error: addOtherError } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: conversation.id, user_id: otherUserId })

    if (addOtherError) {
      console.error('❌ Failed adding other user as participant:', addOtherError)
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
    }

    console.log('✅ Other user added as participant')
    console.log('🎉 Conversation setup complete:', conversation)

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('❌ Conversation API error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
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
        participant: other as any || null,
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

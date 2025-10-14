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

    // Verify current user is a participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Fetch participants (other users) for the conversation
    const { data: others, error } = await supabase
      .from('conversation_participants')
      .select('profiles!inner(id, display_name, primary_photo_url)')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)

    if (error) {
      console.error('Conversation participants fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
    }

    const participants = (others || []).map((row: any) => row.profiles)

    return NextResponse.json({
      id: conversationId,
      participants,
    })
  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

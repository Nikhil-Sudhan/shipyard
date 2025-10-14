import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientWithAccessToken } from '@/lib/supabase-server'
import { ProfileAnswerInsert } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    // Prefer Bearer token if provided by the client (more reliable during onboarding)
    const authHeader = request.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    const supabase = bearer
      ? createClientWithAccessToken(bearer)
      : await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in profile/answers API:', authError || 'No user found')
      return NextResponse.json({ error: 'Unauthorized - Please sign in to continue' }, { status: 401 })
    }

    const body = await request.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers object is required' }, { status: 400 })
    }

    // Ensure a profile row exists for this user to satisfy FK constraint
    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id })

    if (profileUpsertError) {
      console.error('Profile upsert error in profile/answers API:', profileUpsertError)
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
    }

    // Delete existing answers for this user
    await supabase
      .from('profile_answers')
      .delete()
      .eq('user_id', user.id)

    // Insert new answers
    const answerInserts: ProfileAnswerInsert[] = Object.entries(answers).map(([questionKey, answerText]) => ({
      user_id: user.id,
      question_key: questionKey,
      answer_text: answerText as string
    }))

    const { error } = await supabase
      .from('profile_answers')
      .insert(answerInserts)

    if (error) {
      console.error('Profile answers insert error:', error)
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile answers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
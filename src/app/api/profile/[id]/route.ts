import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientWithAccessToken } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const authHeader = request.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null
    const supabase = bearer ? createClientWithAccessToken(bearer) : await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

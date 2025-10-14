import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database schema...')
    
    const supabase = await createClient()
    
    // Test 1: Check if profiles table exists and is accessible
    console.log('📊 Testing profiles table...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(3)
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError)
      return NextResponse.json({ 
        error: 'Profiles table error', 
        details: profilesError.message 
      }, { status: 500 })
    }
    console.log('✅ Profiles table accessible:', profilesData?.length || 0, 'profiles found')
    
    // Test 2: Check if conversations table exists
    console.log('📊 Testing conversations table...')
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('id')
      .limit(3)
    
    if (conversationsError) {
      console.error('❌ Conversations table error:', conversationsError)
      return NextResponse.json({ 
        error: 'Conversations table error', 
        details: conversationsError.message 
      }, { status: 500 })
    }
    console.log('✅ Conversations table accessible:', conversationsData?.length || 0, 'conversations found')
    
    // Test 3: Check if conversation_participants table exists
    console.log('📊 Testing conversation_participants table...')
    const { data: participantsData, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .limit(3)
    
    if (participantsError) {
      console.error('❌ Conversation_participants table error:', participantsError)
      return NextResponse.json({ 
        error: 'Conversation_participants table error', 
        details: participantsError.message 
      }, { status: 500 })
    }
    console.log('✅ Conversation_participants table accessible:', participantsData?.length || 0, 'participants found')
    
    return NextResponse.json({
      success: true,
      tables: {
        profiles: {
          accessible: true,
          count: profilesData?.length || 0,
          sample: profilesData?.[0] || null
        },
        conversations: {
          accessible: true,
          count: conversationsData?.length || 0,
          sample: conversationsData?.[0] || null
        },
        conversation_participants: {
          accessible: true,
          count: participantsData?.length || 0,
          sample: participantsData?.[0] || null
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Database test error:', error)
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

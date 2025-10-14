import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const country = searchParams.get('country')
  const city = searchParams.get('city')
  
  const supabase = await createClient()
  
  // Build the query
  let profileQuery = supabase
    .from('profiles')
    .select('id, display_name, primary_photo_url, location_city, location_country, interests')
  
  // Add search filter if query is provided
  if (query) {
    profileQuery = profileQuery.or(
      `display_name.ilike.%${query}%,interests.cs.{${query}},summary_intro::text.ilike.%${query}%`
    )
  }
  
  // Add location filters if provided
  if (country) {
    profileQuery = profileQuery.eq('location_country', country)
  }
  
  if (city) {
    profileQuery = profileQuery.eq('location_city', city)
  }
  
  // Execute the query
  const { data: profiles, error } = await profileQuery
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ profiles })
}
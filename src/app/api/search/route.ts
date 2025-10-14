import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const country = searchParams.get('country')
    const city = searchParams.get('city')
    
    console.log('Search API called with query:', query)
    
    const supabase = await createClient()
    
    // Build the query - include summary_intro in select
    let profileQuery = supabase
      .from('profiles')
      .select('id, display_name, primary_photo_url, location_city, location_country, interests, summary_intro')
    
    // Add location filters if provided (apply before fetching)
    if (country) {
      profileQuery = profileQuery.eq('location_country', country)
    }
    
    if (city) {
      profileQuery = profileQuery.eq('location_city', city)
    }
    
    // Get all profiles (with location filters if provided)
    // Then filter by search query in JavaScript
    // This is more reliable than complex Supabase queries with array text casting
    const { data: allProfiles, error: fetchError } = await profileQuery
    
    if (fetchError) {
      console.error('❌ Fetch profiles error:', fetchError)
      return NextResponse.json({ error: fetchError.message, details: fetchError }, { status: 500 })
    }
    
    let profiles = allProfiles || []
    
    // Apply search filter if query is provided
    if (query && profiles.length > 0) {
      const keywords = query.trim().toLowerCase().split(/\s+/).filter(k => k.length > 0)
      
      console.log('Searching for keywords:', keywords)
      
      // Filter profiles that match ANY keyword in ANY field
      profiles = profiles.filter(profile => {
        // Check display_name
        const nameMatch = keywords.some(keyword => 
          profile.display_name?.toLowerCase().includes(keyword)
        )
        
        // Check interests array
        const interestsText = (profile.interests || []).join(' ').toLowerCase()
        const interestMatch = keywords.some(keyword => interestsText.includes(keyword))
        
        // Check summary_intro array
        const summaryText = (profile.summary_intro || []).join(' ').toLowerCase()
        const summaryMatch = keywords.some(keyword => summaryText.includes(keyword))
        
        return nameMatch || interestMatch || summaryMatch
      })
      
      console.log(`Filtered ${profiles.length} profiles from ${allProfiles.length} total`)
    }
    
    console.log(`✅ Search for "${query}" returned ${profiles?.length || 0} profiles`)
    
    if (profiles && profiles.length > 0) {
      console.log('Found profiles:', profiles.map(p => ({
        name: p.display_name,
        interests: p.interests
      })))
    }
    
    // If no query provided, return all profiles (for testing)
    if (!query && profiles?.length === 0) {
      console.log('⚠️ No profiles found in database. Make sure you have created some profiles.')
    }
    
    return NextResponse.json({ profiles: profiles || [] })
  } catch (error) {
    console.error('❌ Search API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
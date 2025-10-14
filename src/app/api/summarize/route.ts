import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Not protected, but we can optionally log user if Bearer sent
    const body = await request.json()
    const { answers, interests } = body

    if (!answers || !interests) {
      return NextResponse.json({ error: 'Answers and interests are required' }, { status: 400 })
    }

    // Create a prompt for Gen-Z style summary
    const prompt = `write a gen-z style profile summary in all lowercase. return 3 short intro paragraphs and a 1-line outro. keep it friendly and playful. use the user's answers and interests.

User interests: ${interests.join(', ')}
User answers: ${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join(', ')}

respond as json: {"intro":[p1,p2,p3], "outro": s}.`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a Gen-Z social media expert who writes fun, engaging profile summaries. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    // Parse the JSON response
    const summary = JSON.parse(content)
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Summarize API error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}



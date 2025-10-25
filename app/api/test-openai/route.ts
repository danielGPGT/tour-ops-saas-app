import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    console.log('Testing OpenAI API key...')
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        hasKey: false
      })
    }
    
    console.log('OpenAI API key found:', process.env.OPENAI_API_KEY.substring(0, 10) + '...')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Say 'Hello, OpenAI API is working!'" }
      ],
      max_tokens: 10
    })
    
    const content = response.choices[0]?.message?.content
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working',
      response: content,
      hasKey: true
    })
    
  } catch (error) {
    console.error('OpenAI test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.OPENAI_API_KEY,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

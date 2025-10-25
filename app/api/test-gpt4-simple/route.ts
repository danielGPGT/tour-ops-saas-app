import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    console.log('🧪 TESTING GPT-4 SIMPLE...')
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      })
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "user", 
          content: "Extract this contract information and return ONLY valid JSON: Hotel: Marina Bay Hotel, Contract: HTL-001, Value: 500000 AED. Return format: {\"hotel\": \"string\", \"contract\": \"string\", \"value\": number}" 
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    })
    
    const content = response.choices[0]?.message?.content
    console.log('GPT-4 response:', content)
    
    return NextResponse.json({
      success: true,
      message: 'GPT-4 simple test successful',
      response: content,
      usage: response.usage
    })
    
  } catch (error) {
    console.error('GPT-4 simple test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

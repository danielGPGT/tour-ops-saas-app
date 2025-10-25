import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing API endpoint...')
    
    // Test Supabase connection
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('User:', user?.id)
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Test database query
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    
    console.log('User record:', userRecord)
    console.log('User error:', userError)
    
    // Test organizations table
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5)
    
    console.log('Organizations:', organizations)
    console.log('Organizations error:', orgError)
    
    // If no organizations exist, create one
    if (!organizations || organizations.length === 0) {
      console.log('No organizations found, creating default...')
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization',
          slug: 'test-organization',
          email: 'test@example.com',
          subscription_plan: 'trial',
          is_active: true
        })
        .select('id, name')
        .single()
      
      console.log('Created organization result:', { newOrg, createError })
      
      if (createError) {
        console.error('CREATE ORGANIZATION FAILED:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create organization',
          details: createError.message,
          code: createError.code
        })
      }
    }
    
    // Test OpenAI API key
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    console.log('Has OpenAI key:', hasOpenAIKey)
    
    return NextResponse.json({
      success: true,
      user: user.id,
      organization: userRecord?.organization_id,
      organizations: organizations || [],
      hasOpenAIKey,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG ORGANIZATIONS ===')
    
    const supabase = await createClient()
    
    // Check if we can read organizations
    const { data: orgs, error: readError } = await supabase
      .from('organizations')
      .select('*')
    
    console.log('Organizations read result:', { orgs, readError })
    
    // Try to create an organization
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: 'Debug Organization',
        description: 'Debug test',
        created_at: new Date().toISOString()
      })
      .select('*')
    
    console.log('Organization create result:', { newOrg, createError })
    
    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('organizations')
      .select('*')
      .limit(0)
    
    console.log('Table info:', { tableInfo, tableError })
    
    return NextResponse.json({
      success: true,
      organizations: orgs || [],
      readError,
      createResult: { newOrg, createError },
      tableInfo,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

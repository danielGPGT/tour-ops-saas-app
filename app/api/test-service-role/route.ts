import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING SERVICE ROLE KEY ===')
    
    const supabase = await createClient()
    
    // Test 1: Try to read organizations
    console.log('Test 1: Reading organizations...')
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5)
    
    console.log('Organizations result:', { orgs, orgError })
    
    // Test 2: Try to create a test organization
    console.log('Test 2: Creating test organization...')
    const testOrgId = crypto.randomUUID()
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        name: 'Test Organization',
        slug: 'test-org-' + Date.now(),
        email: 'test@example.com',
        subscription_plan: 'trial',
        is_active: true
      })
      .select('id')
      .single()
    
    console.log('Create organization result:', { newOrg, createError })
    
    // Test 3: Try to delete the test organization
    if (newOrg) {
      console.log('Test 3: Deleting test organization...')
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', testOrgId)
      
      console.log('Delete organization result:', { deleteError })
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        readOrganizations: { orgs, orgError },
        createOrganization: { newOrg, createError },
        deleteOrganization: { deleteError: newOrg ? 'deleted' : 'skipped' }
      }
    })
    
  } catch (error) {
    console.error('Service role test failed:', error)
    return NextResponse.json({ 
      error: 'Service role test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

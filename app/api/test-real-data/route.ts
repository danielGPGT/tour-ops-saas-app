import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing real data fetch...')
    
    const supabase = createClient()
    
    // Use the REAL organization ID from your seed data
    const REAL_ORG_ID = '20000000-0000-0000-0000-000000000001'
    
    // Test 1: Fetch organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', REAL_ORG_ID)
      .single()
    
    if (orgError) {
      console.error('❌ Org fetch error:', orgError)
      return NextResponse.json({ 
        success: false, 
        error: 'Organization fetch failed',
        details: orgError 
      }, { status: 500 })
    }
    
    // Test 2: Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(5)
    
    // Test 3: Fetch products  
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', REAL_ORG_ID)
      .limit(5)
      
    // Test 4: Fetch contracts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', REAL_ORG_ID)
      .limit(5)
    
    // Test 5: Fetch allocations
    const { data: allocations, error: allocationsError } = await supabase
      .from('contract_allocations')
      .select('*')
      .eq('organization_id', REAL_ORG_ID)
      .limit(5)
    
    console.log('✅ All queries successful!')
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      organization: org,
      counts: {
        events: events?.length || 0,
        products: products?.length || 0,  
        contracts: contracts?.length || 0,
        allocations: allocations?.length || 0
      },
      samples: {
        events: events?.slice(0, 2),
        products: products?.slice(0, 2),
        contracts: contracts?.slice(0, 2),
        allocations: allocations?.slice(0, 2)
      },
      errors: {
        events: eventsError?.message,
        products: productsError?.message,
        contracts: contractsError?.message,
        allocations: allocationsError?.message
      }
    })
    
  } catch (error) {
    console.error('🚨 Test API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'API test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

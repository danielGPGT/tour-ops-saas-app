import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get recent activity from audit log
    const { data: auditLogs, error } = await supabase
      .from('audit_log')
      .select(`
        id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id,
        details,
        created_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more to filter out system actions

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    // Process audit logs into activity items
    const activities = []
    
    for (const log of auditLogs || []) {
      try {
        let resourceName = 'Unknown'
        let resourceType = log.table_name?.replace('_', ' ') || 'item'
        let actionType = log.action || 'updated'
        let details = log.details
        let metadata = {}

        // Get resource details based on table
        if (log.table_name && log.record_id) {
          let resourceData = null
          
          switch (log.table_name) {
            case 'products':
              const { data: product } = await supabase
                .from('products')
                .select('name, code')
                .eq('id', log.record_id)
                .single()
              if (product) {
                resourceName = product.name
                resourceType = 'product'
              }
              break
              
            case 'contracts':
              const { data: contract } = await supabase
                .from('contracts')
                .select('contract_name')
                .eq('id', log.record_id)
                .single()
              if (contract) {
                resourceName = contract.contract_name
                resourceType = 'contract'
              }
              break
              
            case 'contract_allocations':
              const { data: allocation } = await supabase
                .from('contract_allocations')
                .select('allocation_name, contract_id')
                .eq('id', log.record_id)
                .single()
              if (allocation) {
                resourceName = allocation.allocation_name
                resourceType = 'allocation'
                metadata = { contract_id: allocation.contract_id }
              }
              break
              
            case 'events':
              const { data: event } = await supabase
                .from('events')
                .select('name')
                .eq('id', log.record_id)
                .single()
              if (event) {
                resourceName = event.name
                resourceType = 'event'
              }
              break
              
            case 'bookings':
              const { data: booking } = await supabase
                .from('bookings')
                .select('booking_name, reference')
                .eq('id', log.record_id)
                .single()
              if (booking) {
                resourceName = booking.booking_name || booking.reference
                resourceType = 'booking'
              }
              break
          }
        }

        // Map actions to user-friendly terms
        let mappedAction = actionType
        switch (actionType) {
          case 'INSERT':
            mappedAction = 'created'
            break
          case 'UPDATE':
            mappedAction = 'updated'
            break
          case 'DELETE':
            mappedAction = 'deleted'
            break
          case 'LINK':
            mappedAction = 'linked'
            break
          case 'UNLINK':
            mappedAction = 'unlinked'
            break
        }

        // Get user information
        let userName = 'System'
        let userAvatar = null
        
        if (log.user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('first_name, last_name, avatar_url')
            .eq('id', log.user_id)
            .single()
          
          if (user) {
            userName = `${user.first_name} ${user.last_name}`.trim() || 'User'
            userAvatar = user.avatar_url
          }
        }

        // Skip system actions or ones without meaningful names
        if (resourceName === 'Unknown' || resourceName === '') continue

        activities.push({
          id: log.id,
          action: mappedAction,
          resource_type: resourceType,
          resource_id: log.record_id,
          resource_name: resourceName,
          details: details,
          user_id: log.user_id,
          user_name: userName,
          user_avatar: userAvatar,
          created_at: log.created_at,
          metadata: metadata
        })

        // Stop once we have enough activities
        if (activities.length >= limit) break

      } catch (error) {
        console.error('Error processing audit log:', log.id, error)
        continue
      }
    }

    return NextResponse.json(activities)

  } catch (error) {
    console.error('Error in dashboard activity API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

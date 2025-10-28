import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { allocation_id, contract_id, message, priority, recipients } = body

    if (!allocation_id || !contract_id) {
      return NextResponse.json({ error: 'Allocation ID and Contract ID are required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get allocation and contract details for the notification
    const { data: allocation, error: allocationError } = await supabase
      .from('contract_allocations')
      .select(`
        id,
        allocation_name,
        total_quantity,
        total_cost,
        currency,
        valid_from,
        valid_to,
        release_days,
        contract:contracts(
          id,
          contract_name,
          supplier:suppliers(name, contact_email)
        ),
        product:products(name)
      `)
      .eq('id', allocation_id)
      .single()

    if (allocationError || !allocation) {
      console.error('Error fetching allocation:', allocationError)
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
    }

    // Log the notification in the database
    const { error: logError } = await supabase
      .from('notifications')
      .insert({
        type: 'release_reminder',
        title: `Release Deadline Alert: ${allocation.allocation_name}`,
        message: message || `Urgent attention required for allocation "${allocation.allocation_name}" - release deadline approaching.`,
        priority: priority || 'high',
        related_allocation_id: allocation_id,
        related_contract_id: contract_id,
        recipients: Array.isArray(recipients) ? recipients : ['sales-team'],
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error logging notification:', logError)
      // Don't fail the request for logging errors
    }

    // In a real implementation, this would:
    // 1. Send emails to the sales team
    // 2. Create in-app notifications
    // 3. Send Slack/Teams messages
    // 4. Create tasks in CRM/task management system
    
    // Mock email sending (in real app, use SendGrid, AWS SES, etc.)
    const emailData = {
      to: ['sales@tourcompany.com', 'managers@tourcompany.com'],
      subject: `🚨 RELEASE DEADLINE ALERT: ${allocation.allocation_name}`,
      template: 'release-reminder',
      data: {
        allocation_name: allocation.allocation_name,
        contract_name: allocation.contract?.contract_name,
        supplier_name: allocation.contract?.supplier?.name,
        product_name: allocation.product?.name,
        release_date: allocation.valid_from, // Would calculate actual release date
        message: message,
        priority: priority,
        action_url: `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${contract_id}?tab=allocations&highlight=${allocation_id}`
      }
    }

    console.log('Would send email notification:', emailData)

    // Mock Slack notification
    const slackData = {
      channel: '#sales-alerts',
      text: `🚨 *RELEASE DEADLINE ALERT*\n\n*Allocation:* ${allocation.allocation_name}\n*Contract:* ${allocation.contract?.contract_name}\n*Priority:* ${priority.toUpperCase()}\n\n${message}\n\n<${emailData.data.action_url}|View Details>`,
      priority: priority
    }

    console.log('Would send Slack notification:', slackData)

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        table_name: 'contract_allocations',
        record_id: allocation_id,
        action: 'notification_sent',
        old_values: null,
        new_values: {
          notification_type: 'release_reminder',
          priority: priority,
          recipients: recipients
        },
        user_id: null, // Would get from session
        details: `Release reminder sent for allocation: ${allocation.allocation_name}`
      })

    if (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Release reminder sent successfully',
      notification_id: allocation_id, // In real app, would return actual notification ID
      recipients_count: Array.isArray(recipients) ? recipients.length : 1
    })

  } catch (error) {
    console.error('Error in send-reminder API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to determine notification urgency
function getNotificationUrgency(daysUntilRelease: number) {
  if (daysUntilRelease <= 1) return 'critical'
  if (daysUntilRelease <= 3) return 'urgent'
  if (daysUntilRelease <= 7) return 'high'
  return 'medium'
}

// Helper function to get appropriate recipients based on urgency
function getNotificationRecipients(priority: string, allocationValue: number) {
  const recipients = ['sales-team']
  
  if (priority === 'critical' || priority === 'urgent') {
    recipients.push('sales-managers', 'operations-manager')
  }
  
  if (priority === 'critical' && allocationValue > 100000) {
    recipients.push('ceo', 'cfo')
  }
  
  return recipients
}

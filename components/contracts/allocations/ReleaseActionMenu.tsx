'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MoreVertical,
  Mail, 
  Phone, 
  TrendingDown, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  MessageCircle,
  ExternalLink,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface ReleaseActionMenuProps {
  allocation: any
  warning?: any
  onActionComplete?: (action: string) => void
}

interface ActionDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  children: React.ReactNode
}

export function ReleaseActionMenu({ 
  allocation, 
  warning, 
  onActionComplete 
}: ReleaseActionMenuProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const router = useRouter()
  
  const daysUntilRelease = warning?.days_until_release || 
    (allocation?.release_date ? differenceInDays(new Date(allocation.release_date), new Date()) : null)
  
  const urgencyLevel = daysUntilRelease !== null ? 
    (daysUntilRelease <= 3 ? 'critical' : 
     daysUntilRelease <= 7 ? 'high' : 'medium') : 'low'

  const handleAction = (action: string) => {
    setSelectedAction(action)
  }

  const handleCloseDialog = () => {
    setSelectedAction(null)
  }

  const handleNavigateToContract = () => {
    router.push(`/contracts/${allocation.contract_id}?tab=allocations&highlight=${allocation.id}`)
  }

  const handleNavigateToRates = () => {
    router.push(`/products/${allocation.product_id}/rates?allocation=${allocation.id}&action=reduce-price`)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleAction('send-reminder')}>
            <Mail className="h-4 w-4 mr-2" />
            Send Sales Reminder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('contact-supplier')}>
            <Phone className="h-4 w-4 mr-2" />
            Contact Supplier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateToRates}>
            <TrendingDown className="h-4 w-4 mr-2" />
            Adjust Pricing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('emergency-protocol')}>
            <Zap className="h-4 w-4 mr-2" />
            Emergency Protocol
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('extend-deadline')}>
            <Clock className="h-4 w-4 mr-2" />
            Request Extension
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNavigateToContract}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Dialogs */}
      {selectedAction === 'send-reminder' && (
        <SendReminderDialog
          allocation={allocation}
          warning={warning}
          onClose={handleCloseDialog}
          onSuccess={() => {
            onActionComplete?.('send-reminder')
            handleCloseDialog()
          }}
        />
      )}

      {selectedAction === 'contact-supplier' && (
        <ContactSupplierDialog
          allocation={allocation}
          warning={warning}
          onClose={handleCloseDialog}
          onSuccess={() => {
            onActionComplete?.('contact-supplier')
            handleCloseDialog()
          }}
        />
      )}

      {selectedAction === 'emergency-protocol' && (
        <EmergencyProtocolDialog
          allocation={allocation}
          warning={warning}
          onClose={handleCloseDialog}
          onSuccess={() => {
            onActionComplete?.('emergency-protocol')
            handleCloseDialog()
          }}
        />
      )}

      {selectedAction === 'extend-deadline' && (
        <ExtendDeadlineDialog
          allocation={allocation}
          warning={warning}
          onClose={handleCloseDialog}
          onSuccess={() => {
            onActionComplete?.('extend-deadline')
            handleCloseDialog()
          }}
        />
      )}
    </>
  )
}

function ActionDialog({ open, onClose, title, description, children }: ActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function SendReminderDialog({ 
  allocation, 
  warning, 
  onClose, 
  onSuccess 
}: {
  allocation: any
  warning?: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'high' | 'urgent' | 'critical'>('high')
  const [isLoading, setIsLoading] = useState(false)

  const daysUntil = warning?.days_until_release || 0
  const suggestedMessage = `RELEASE ALERT: "${allocation.allocation_name}" needs immediate attention.

• Release deadline: ${daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil} days`}
• Units remaining: ${warning?.available_quantity || allocation.available_quantity || 0}
• Potential loss: ${allocation.currency} ${Math.round(warning?.potential_loss || 0).toLocaleString()}

Action required: Push sales or prepare for penalty/release.`

  const handleSend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation_id: allocation.id,
          contract_id: allocation.contract_id,
          message: message || suggestedMessage,
          priority,
          recipients: ['sales-team', 'managers'] // Could be configurable
        })
      })

      if (!response.ok) throw new Error('Failed to send reminder')

      toast.success('Reminder sent to sales team')
      onSuccess()
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast.error('Failed to send reminder')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ActionDialog
      open={true}
      onClose={onClose}
      title="Send Sales Team Reminder"
      description="Alert your sales team about this urgent release deadline"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Priority Level</Label>
          <div className="flex gap-2">
            {['high', 'urgent', 'critical'].map((level) => (
              <Button
                key={level}
                variant={priority === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority(level as any)}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={suggestedMessage}
            rows={6}
          />
          <div className="text-xs text-muted-foreground">
            Leave blank to use suggested message
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reminder'}
          </Button>
        </div>
      </div>
    </ActionDialog>
  )
}

function ContactSupplierDialog({ 
  allocation, 
  warning, 
  onClose, 
  onSuccess 
}: {
  allocation: any
  warning?: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [contactMethod, setContactMethod] = useState<'email' | 'phone' | 'both'>('email')
  const [message, setMessage] = useState('')
  const [urgentRequest, setUrgentRequest] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const daysUntil = warning?.days_until_release || 0
  const suggestedMessage = `Dear ${allocation.contract?.supplier?.name || 'Supplier'},

Regarding our allocation for "${allocation.allocation_name}" (Contract: ${allocation.contract?.contract_name}):

• Current status: ${warning?.available_quantity || 0} units remaining unsold
• Release deadline: ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
• Potential discussion: ${urgentRequest ? 'Extension request or modified terms' : 'Current status update'}

We would like to discuss our options regarding this allocation. Please contact us at your earliest convenience.

Best regards,
Tour Operations Team`

  const handleContact = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/communications/contact-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation_id: allocation.id,
          contract_id: allocation.contract_id,
          supplier_id: allocation.contract?.supplier_id,
          contact_method: contactMethod,
          message: message || suggestedMessage,
          urgent: urgentRequest,
          subject: `Allocation Release - ${allocation.allocation_name}`
        })
      })

      if (!response.ok) throw new Error('Failed to contact supplier')

      toast.success(`${contactMethod === 'phone' ? 'Call scheduled' : 'Email sent'} to supplier`)
      onSuccess()
    } catch (error) {
      console.error('Error contacting supplier:', error)
      toast.error('Failed to contact supplier')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ActionDialog
      open={true}
      onClose={onClose}
      title="Contact Supplier"
      description="Reach out to the supplier about this allocation"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Contact Method</Label>
          <div className="flex gap-2">
            {[
              { value: 'email', label: 'Email', icon: Mail },
              { value: 'phone', label: 'Phone', icon: Phone },
              { value: 'both', label: 'Both', icon: MessageCircle }
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={contactMethod === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setContactMethod(value as any)}
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="urgent"
            checked={urgentRequest}
            onChange={(e) => setUrgentRequest(e.target.checked)}
          />
          <Label htmlFor="urgent">Mark as urgent request</Label>
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={suggestedMessage}
            rows={6}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleContact} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Contact Supplier'}
          </Button>
        </div>
      </div>
    </ActionDialog>
  )
}

function EmergencyProtocolDialog({ 
  allocation, 
  warning, 
  onClose, 
  onSuccess 
}: {
  allocation: any
  warning?: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const emergencyActions = [
    { id: 'price-drop', label: 'Emergency Price Drop (20-40%)', icon: TrendingDown },
    { id: 'sales-blast', label: 'Urgent Sales Team Alert', icon: Users },
    { id: 'supplier-call', label: 'Emergency Supplier Call', icon: Phone },
    { id: 'management-escalation', label: 'Escalate to Management', icon: AlertTriangle },
    { id: 'penalty-preparation', label: 'Prepare Penalty Documentation', icon: DollarSign },
  ]

  const handleToggleAction = (actionId: string) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }

  const handleExecute = async () => {
    if (selectedActions.length === 0) {
      toast.error('Please select at least one action')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/emergency/execute-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation_id: allocation.id,
          contract_id: allocation.contract_id,
          actions: selectedActions,
          notes,
          triggered_by: 'release_deadline_emergency'
        })
      })

      if (!response.ok) throw new Error('Failed to execute emergency protocol')

      toast.success('Emergency protocol initiated')
      onSuccess()
    } catch (error) {
      console.error('Error executing emergency protocol:', error)
      toast.error('Failed to execute emergency protocol')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ActionDialog
      open={true}
      onClose={onClose}
      title="Emergency Protocol"
      description="Execute emergency measures for critical release deadline"
    >
      <div className="space-y-4">
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle>Critical Action Required</AlertTitle>
          <AlertDescription>
            This allocation is at critical risk. Select appropriate emergency measures.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>Emergency Actions</Label>
          <div className="space-y-2">
            {emergencyActions.map(({ id, label, icon: Icon }) => (
              <div key={id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={id}
                  checked={selectedActions.includes(id)}
                  onChange={() => handleToggleAction(id)}
                />
                <Label htmlFor={id} className="flex items-center cursor-pointer">
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Additional Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document the situation and any special considerations..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleExecute} 
            disabled={isLoading || selectedActions.length === 0}
            variant="destructive"
          >
            {isLoading ? 'Executing...' : 'Execute Protocol'}
          </Button>
        </div>
      </div>
    </ActionDialog>
  )
}

function ExtendDeadlineDialog({ 
  allocation, 
  warning, 
  onClose, 
  onSuccess 
}: {
  allocation: any
  warning?: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [requestedDays, setRequestedDays] = useState(7)
  const [justification, setJustification] = useState('')
  const [offerIncentive, setOfferIncentive] = useState(false)
  const [incentiveType, setIncentiveType] = useState<'discount' | 'penalty_waiver' | 'future_commitment'>('discount')
  const [isLoading, setIsLoading] = useState(false)

  const currentReleaseDate = new Date(allocation.release_date || Date.now())
  const newReleaseDate = new Date(currentReleaseDate.getTime() + requestedDays * 24 * 60 * 60 * 1000)

  const handleRequest = async () => {
    if (!justification.trim()) {
      toast.error('Please provide justification for the extension')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/supplier/request-extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation_id: allocation.id,
          contract_id: allocation.contract_id,
          current_release_date: allocation.release_date,
          requested_extension_days: requestedDays,
          new_release_date: newReleaseDate.toISOString(),
          justification,
          offer_incentive: offerIncentive,
          incentive_type: offerIncentive ? incentiveType : null
        })
      })

      if (!response.ok) throw new Error('Failed to request extension')

      toast.success('Extension request sent to supplier')
      onSuccess()
    } catch (error) {
      console.error('Error requesting extension:', error)
      toast.error('Failed to request extension')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ActionDialog
      open={true}
      onClose={onClose}
      title="Request Deadline Extension"
      description="Ask supplier for additional time to sell remaining inventory"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Extension Period</Label>
          <div className="flex gap-2">
            {[3, 7, 14, 30].map(days => (
              <Button
                key={days}
                variant={requestedDays === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRequestedDays(days)}
              >
                {days} days
              </Button>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            New release date: {format(newReleaseDate, 'MMM d, yyyy')}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Justification *</Label>
          <Textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain why you need more time (e.g., market conditions, promotional opportunities, etc.)"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="incentive"
            checked={offerIncentive}
            onChange={(e) => setOfferIncentive(e.target.checked)}
          />
          <Label htmlFor="incentive">Offer incentive to supplier</Label>
        </div>

        {offerIncentive && (
          <div className="space-y-2">
            <Label>Incentive Type</Label>
            <div className="space-y-1">
              {[
                { value: 'discount', label: 'Volume discount on future bookings' },
                { value: 'penalty_waiver', label: 'Waive standard penalty fees' },
                { value: 'future_commitment', label: 'Commit to larger allocation next season' }
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={value}
                    name="incentive_type"
                    checked={incentiveType === value}
                    onChange={() => setIncentiveType(value as any)}
                  />
                  <Label htmlFor={value} className="text-sm">{label}</Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRequest} disabled={isLoading || !justification.trim()}>
            {isLoading ? 'Sending...' : 'Request Extension'}
          </Button>
        </div>
      </div>
    </ActionDialog>
  )
}

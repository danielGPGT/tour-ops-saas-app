'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, X } from 'lucide-react'

interface Payment {
  id: string
  payment_number: number
  due_date: string
  amount_due: number
  percentage?: number
  description?: string
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived'
  paid_date?: string
  paid_amount?: number
  payment_reference?: string
}

interface PaymentTrackerProps {
  payments: Payment[]
  onPaymentsChange: (payments: Payment[]) => void
  totalValue?: number
  currency?: string
}

export function PaymentTracker({ payments, onPaymentsChange, totalValue, currency = 'USD' }: PaymentTrackerProps) {
  const addPayment = () => {
    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      payment_number: payments.length + 1,
      due_date: '',
      amount_due: 0,
      description: '',
      status: 'pending'
    }
    onPaymentsChange([...payments, newPayment])
  }

  const removePayment = (id: string) => {
    onPaymentsChange(payments.filter(p => p.id !== id))
  }

  const updatePayment = (id: string, field: keyof Payment, value: any) => {
    onPaymentsChange(payments.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const calculateTotal = () => {
    return payments.reduce((sum, payment) => sum + (payment.amount_due || 0), 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'waived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const totalAmount = calculateTotal()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Payment Schedule</h4>
        <Button onClick={addPayment} size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No payments added yet
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-2 p-2 border rounded-md">
              <div className="flex-1 grid grid-cols-4 gap-2 text-xs">
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    className="h-7 text-xs"
                    value={payment.due_date}
                    onChange={(e) => updatePayment(payment.id, 'due_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    className="h-7 text-xs"
                    value={payment.amount_due || ''}
                    onChange={(e) => updatePayment(payment.id, 'amount_due', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select 
                    value={payment.status} 
                    onValueChange={(value) => updatePayment(payment.id, 'status', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input
                    className="h-7 text-xs"
                    value={payment.description || ''}
                    onChange={(e) => updatePayment(payment.id, 'description', e.target.value)}
                    placeholder="e.g., 50% deposit"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePayment(payment.id)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {totalValue && (
            <div className="text-xs text-muted-foreground text-center">
              Total: {currency} {totalAmount.toLocaleString()} 
              {totalAmount !== totalValue && (
                <span className="text-yellow-600">
                  {' '}({totalAmount < totalValue ? 'under' : 'over'} by {Math.abs(totalAmount - totalValue).toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

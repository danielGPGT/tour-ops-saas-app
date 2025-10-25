'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContractPoliciesProps {
  data: any
  onDataUpdate: (field: string, value: any) => void
}

export function ContractPolicies({ data, onDataUpdate }: ContractPoliciesProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Textarea
            id="payment_terms"
            value={data?.payment_terms || ''}
            onChange={(e) => onDataUpdate('payment_terms', e.target.value)}
            placeholder="e.g., 50% deposit on signing, 25% 60 days before arrival, 25% 30 days before arrival"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
          <Textarea
            id="cancellation_policy"
            value={data?.cancellation_policy || ''}
            onChange={(e) => onDataUpdate('cancellation_policy', e.target.value)}
            placeholder="e.g., Free cancellation until 30 days before arrival. 50% penalty within 30 days."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attrition_policy">Attrition Policy</Label>
          <Textarea
            id="attrition_policy"
            value={data?.attrition_policy || ''}
            onChange={(e) => onDataUpdate('attrition_policy', e.target.value)}
            placeholder="e.g., 10% attrition allowed without penalty. Additional rooms subject to 50% penalty."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="has_attrition"
            checked={data?.has_attrition || false}
            onCheckedChange={(checked) => onDataUpdate('has_attrition', checked)}
          />
          <Label htmlFor="has_attrition">
            This contract has attrition penalties
          </Label>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Clock, CheckCircle, Zap } from 'lucide-react'

interface ContractTypeSelectorProps {
  onSelectType: (type: ContractType) => void
  onClose: () => void
}

type ContractType = 'hotel_allocation' | 'batch_purchase' | 'series' | 'on_request'

const CONTRACT_TYPES = [
  {
    type: 'hotel_allocation' as const,
    label: 'Hotel Allocation',
    icon: '🏨',
    description: 'Room blocks with release dates and policies',
    time: '3 minutes',
    features: ['Allocations', 'Release dates', 'Payment tracking', 'PDF upload'],
    wizard: 'multi-step',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    type: 'batch_purchase' as const,
    label: 'Purchase Order',
    icon: '🎫',
    description: 'Bought tickets, tours, activities - quick entry',
    time: '30 seconds',
    features: ['Quick entry', 'Batch inventory', 'Simple tracking'],
    wizard: 'single-screen',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    type: 'series' as const,
    label: 'Series Contract',
    icon: '📄',
    description: 'Ongoing rate agreement for multiple products',
    time: '90 seconds',
    features: ['Multiple products', 'Commission rates', 'Date ranges'],
    wizard: 'two-step',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    type: 'on_request' as const,
    label: 'On Request',
    icon: '🤝',
    description: 'Ad-hoc agreement, quote each time',
    time: '20 seconds',
    features: ['Commission only', 'No allocations', 'Quick setup'],
    wizard: 'single-screen',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    iconColor: 'text-orange-600'
  }
]

export function ContractTypeSelector({ onSelectType, onClose }: ContractTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<ContractType | null>(null)

  const handleContinue = () => {
    if (selectedType) {
      onSelectType(selectedType)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          What type of contract?
        </h2>
        <p className="text-muted-foreground">
          Choose the entry mode that best fits your contract type
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONTRACT_TYPES.map((contractType) => (
          <Card
            key={contractType.type}
            className={`cursor-pointer transition-all duration-200 ${
              selectedType === contractType.type
                ? 'ring-2 ring-primary ring-offset-2'
                : 'hover:shadow-md'
            } ${contractType.color}`}
            onClick={() => setSelectedType(contractType.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{contractType.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{contractType.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {contractType.description}
                    </p>
                  </div>
                </div>
                {selectedType === contractType.type && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {contractType.time}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {contractType.wizard}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  {contractType.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        
        <Button 
          onClick={handleContinue}
          disabled={!selectedType}
          className="flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


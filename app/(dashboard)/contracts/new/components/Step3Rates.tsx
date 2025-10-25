'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DollarSign, SkipForward, Plus, CheckCircle } from 'lucide-react'

interface Step3RatesProps {
  data: any[]
  extractedData: any
  onDataUpdate: (data: any[]) => void
  onSubmit: () => void
  onPrevious: () => void
  isSubmitting: boolean
}

export function Step3Rates({ data, extractedData, onDataUpdate, onSubmit, onPrevious, isSubmitting }: Step3RatesProps) {
  const [selectedOption, setSelectedOption] = useState<'skip' | 'add'>('skip')

  // Auto-populate rates when extracted data is available
  useEffect(() => {
    if (extractedData?.extracted && (!data || data.length === 0)) {
      console.log('🔄 Auto-populating Step 3 with extracted data:', extractedData.extracted)
      
      const extracted = extractedData.extracted
      const newRates: any[] = []
      
      // Create rates from room requirements
      if (extracted.room_requirements && extracted.room_requirements.length > 0) {
        extracted.room_requirements.forEach((room: any, index: number) => {
          const rate = {
            id: `rate-${Date.now()}-${index}`,
            product_id: '', // Will need to be matched later
            rate_name: `${room.room_type} - ${extracted.contract_name || 'Event'}`,
            rate_type: 'per_night',
            base_rate: room.base_rate || 0,
            surcharge: room.surcharge || 0,
            total_rate: room.total_rate || 0,
            currency: extracted.currency || 'USD',
            valid_from: extracted.event_dates?.start_date || extracted.contract_dates?.valid_from || '',
            valid_to: extracted.event_dates?.end_date || extracted.contract_dates?.valid_to || '',
            min_nights: room.nights || null,
            max_nights: room.nights || null,
            includes: room.includes || '',
            notes: `Base rate: ${extracted.currency} ${room.base_rate}${room.surcharge > 0 ? ` + ${room.surcharge} surcharge` : ''}. ${room.includes || ''}`,
            is_active: true
          }
          newRates.push(rate)
        })
      }
      
      if (newRates.length > 0) {
        console.log('📝 Creating rates from extracted data:', newRates)
        onDataUpdate(newRates)
        setSelectedOption('add') // Auto-select add option if rates are found
      }
    }
  }, [extractedData, data, onDataUpdate])

  const handleSubmit = () => {
    onSubmit()
  }

  const handleSkip = () => {
    onSubmit()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Rates (Optional)
        </h2>
        <p className="text-muted-foreground">
          You can add rates now or later from the contract details page
        </p>
      </div>

      {/* Option Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Skip Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            selectedOption === 'skip' 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => setSelectedOption('skip')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SkipForward className="h-5 w-5 text-primary" />
              Skip for Now
              {selectedOption === 'skip' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Most contracts don't need rates set up immediately
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Add rates later from contract page</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Focus on contract basics first</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Save time and get started quickly</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Rates Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            selectedOption === 'add' 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => setSelectedOption('add')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Add Rates Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Set up rates and pricing for your allocations
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Quick rate entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Link to supplier rates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Ready for booking</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skip Option Content */}
      {selectedOption === 'skip' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <SkipForward className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Skip Rates Setup</h3>
                <p className="text-muted-foreground mb-4">
                  You can always add rates later from the contract details page. 
                  This is the fastest way to get your contract created.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <div className="font-medium mb-2">You can add rates later by:</div>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Going to the contract details page</li>
                    <li>Clicking "Add Rates" in the rates section</li>
                    <li>Setting up pricing for each allocation</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Rates Option Content */}
      {selectedOption === 'add' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Quick Rate Entry</h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate
                </Button>
              </div>
              
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-secondary" />
                </div>
                <h4 className="font-medium mb-2">Rate Entry Coming Soon</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  The rate entry form will be available in the next update. 
                  For now, you can skip this step and add rates later.
                </p>
                <Button variant="outline" onClick={() => setSelectedOption('skip')}>
                  Skip for Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Contract Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm text-muted-foreground">Contract</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Allocations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data?.reduce((sum, a) => sum + (a.releases?.length || 0), 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Release Dates</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {selectedOption === 'skip' ? '0' : 'TBD'}
              </div>
              <div className="text-sm text-muted-foreground">Rates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={selectedOption === 'skip' ? handleSkip : handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              Creating Contract...
            </>
          ) : (
            <>
              {selectedOption === 'skip' ? 'Skip & Create Contract' : 'Create Contract'}
              <CheckCircle className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

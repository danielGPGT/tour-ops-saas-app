'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AllocationForm } from './AllocationForm'
import { ReleaseScheduleBuilder } from './ReleaseScheduleBuilder'
import { Plus, Package, Calendar } from 'lucide-react'

interface Step2AllocationsProps {
  data: any[]
  extractedData: any
  onDataUpdate: (data: any[]) => void
  onNext: () => void
  onPrevious: () => void
}

export function Step2Allocations({ data, extractedData, onDataUpdate, onNext, onPrevious }: Step2AllocationsProps) {
  const [selectedAllocation, setSelectedAllocation] = useState<number | null>(null)
  const [showReleaseBuilder, setShowReleaseBuilder] = useState(false)

  // Auto-populate allocations when extracted data is available
  useEffect(() => {
    if (extractedData?.extracted && (!data || data.length === 0)) {
      console.log('🔄 Auto-populating Step 2 with extracted data:', extractedData.extracted)
      
      const extracted = extractedData.extracted
      const newAllocations: any[] = []
      
      // Create allocations from room requirements
      if (extracted.room_requirements && extracted.room_requirements.length > 0) {
        extracted.room_requirements.forEach((room: any, index: number) => {
          const allocation = {
            id: `allocation-${Date.now()}-${index}`,
            product_id: '', // Will need to be matched later
            allocation_name: `${room.room_type} - ${extracted.contract_name || 'Event'}`,
            allocation_type: 'allotment',
            total_quantity: room.quantity || 0,
            valid_from: extracted.event_dates?.start_date || extracted.contract_dates?.valid_from || '',
            valid_to: extracted.event_dates?.end_date || extracted.contract_dates?.valid_to || '',
            total_cost: (room.total_rate || 0) * (room.quantity || 0) * (room.nights || 1),
            cost_per_unit: room.total_rate || 0,
            min_nights: room.nights || null,
            max_nights: room.nights || null,
            notes: `Base rate: ${extracted.currency} ${room.base_rate}${room.surcharge > 0 ? ` + ${room.surcharge} surcharge` : ''}. ${room.includes || ''}`,
            releases: []
          }
          newAllocations.push(allocation)
        })
      }
      
      // Create release schedule from extracted data
      if (extracted.release_schedule && extracted.release_schedule.length > 0) {
        // Apply release schedule to all allocations
        newAllocations.forEach(allocation => {
          allocation.releases = extracted.release_schedule.map((release: any) => ({
            id: `release-${Date.now()}-${Math.random()}`,
            release_date: release.release_date,
            release_percentage: release.release_percentage,
            penalty_applies: release.penalty_applies || false,
            notes: release.notes || ''
          }))
        })
      }
      
      if (newAllocations.length > 0) {
        console.log('📝 Creating allocations from extracted data:', newAllocations)
        onDataUpdate(newAllocations)
      }
    }
  }, [extractedData, data, onDataUpdate])

  const addAllocation = () => {
    const newAllocation = {
      id: `allocation-${Date.now()}`,
      product_id: '',
      allocation_name: '',
      allocation_type: 'allotment',
      total_quantity: 0,
      valid_from: '',
      valid_to: '',
      total_cost: 0,
      cost_per_unit: 0,
      min_nights: null,
      max_nights: null,
      notes: '',
      releases: []
    }
    const currentData = data || []
    onDataUpdate([...currentData, newAllocation])
    setSelectedAllocation(currentData.length)
  }

  const updateAllocation = (index: number, field: string, value: any) => {
    const currentData = data || []
    const updated = [...currentData]
    updated[index] = { ...updated[index], [field]: value }
    onDataUpdate(updated)
  }

  const removeAllocation = (index: number) => {
    const currentData = data || []
    const updated = currentData.filter((_, i) => i !== index)
    onDataUpdate(updated)
    if (selectedAllocation === index) {
      setSelectedAllocation(null)
    } else if (selectedAllocation && selectedAllocation > index) {
      setSelectedAllocation(selectedAllocation - 1)
    }
  }

  const handleNext = () => {
    const currentData = data || []
    if (currentData.length === 0) {
      alert('Please add at least one allocation')
      return
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Allocations & Release Schedule
        </h2>
        <p className="text-muted-foreground">
          Add inventory blocks and set up release schedules
        </p>
      </div>

      {/* Allocations List */}
      <div className="space-y-4">
        {data && data.length > 0 ? data.map((allocation, index) => (
          <Card key={allocation.id} className={selectedAllocation === index ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Allocation #{index + 1}
                  {allocation.allocation_name && (
                    <Badge variant="secondary">{allocation.allocation_name}</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAllocation(selectedAllocation === index ? null : index)}
                  >
                    {selectedAllocation === index ? 'Hide' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAllocation(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {selectedAllocation === index && (
              <CardContent>
                <AllocationForm
                  allocation={allocation}
                  onUpdate={(field, value) => updateAllocation(index, field, value)}
                />
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Release Schedule
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Set up inventory release dates and penalties
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReleaseBuilder(!showReleaseBuilder)}
                    >
                      {showReleaseBuilder ? 'Hide Builder' : 'Show Builder'}
                    </Button>
                  </div>
                  
                  {showReleaseBuilder && (
                    <ReleaseScheduleBuilder
                      allocation={allocation}
                      onUpdate={(releases) => updateAllocation(index, 'releases', releases)}
                    />
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No Allocations Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first allocation
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Allocation Button */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-2">Add New Allocation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create inventory blocks for your contract
            </p>
            <Button onClick={addAllocation}>
              <Plus className="h-4 w-4 mr-2" />
              Add Allocation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {data && data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allocation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{data?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Allocations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data?.reduce((sum, a) => sum + (a.total_quantity || 0), 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Quantity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data?.reduce((sum, a) => sum + (a.releases?.length || 0), 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Release Dates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data?.filter(a => a.releases?.some((r: any) => r.penalty_applies)).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">With Penalties</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleNext}>
          Next: Rates
        </Button>
      </div>
    </div>
  )
}

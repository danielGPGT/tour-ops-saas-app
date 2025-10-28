'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus, Table } from 'lucide-react'
import { AllocationsSummary } from './AllocationsSummary'
import { ReleaseWarnings } from './ReleaseWarnings'
import { AllocationsTable } from './AllocationsTable'
import { ContractAllocationCalendarView } from './ContractAllocationCalendarView'
import { AllocationFormDialog } from './AllocationFormDialog'
import { AllocationDetailsDrawer } from './AllocationDetailsDrawer'
import { AllocationPoolsManager } from './AllocationPoolsManager'

interface ContractAllocationsTabProps {
  contractId: string
}

export function ContractAllocationsTab({ contractId }: ContractAllocationsTabProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null)
  const [view, setView] = useState<'table' | 'calendar'>('table')

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <AllocationsSummary contractId={contractId} />
      
      {/* Release Warnings */}
      <ReleaseWarnings contractId={contractId} />
      
      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract Allocations</CardTitle>
              <CardDescription>
                Manage inventory blocks from this contract
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView(view === 'table' ? 'calendar' : 'table')}
              >
                {view === 'table' ? <Calendar className="h-4 w-4" /> : <Table className="h-4 w-4" />}
                {view === 'table' ? 'Calendar View' : 'Table View'}
              </Button>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Allocation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'table' ? (
            <AllocationsTable 
              contractId={contractId}
              onSelect={setSelectedAllocation}
            />
          ) : (
            <ContractAllocationCalendarView contractId={contractId} />
          )}
        </CardContent>
      </Card>
      
      {/* Pools Management */}
      <AllocationPoolsManager contractId={contractId} />
      
      {/* Dialogs/Drawers */}
      {isCreating && (
        <AllocationFormDialog
          contractId={contractId}
          onClose={() => setIsCreating(false)}
        />
      )}
      
      {selectedAllocation && (
        <AllocationDetailsDrawer
          allocationId={selectedAllocation}
          onClose={() => setSelectedAllocation(null)}
        />
      )}
    </div>
  )
}

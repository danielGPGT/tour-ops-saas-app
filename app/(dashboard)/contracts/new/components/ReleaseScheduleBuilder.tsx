'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Release {
  id: string
  release_date: string
  release_type: 'percentage' | 'quantity' | 'remaining'
  release_percentage?: number
  release_quantity?: number
  penalty_applies: boolean
  notes?: string
}

interface ReleaseScheduleBuilderProps {
  allocation: any
  onUpdate: (releases: Release[]) => void
}

export function ReleaseScheduleBuilder({ allocation, onUpdate }: ReleaseScheduleBuilderProps) {
  const [releases, setReleases] = useState<Release[]>(allocation.releases || [])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addRelease = () => {
    const newRelease: Release = {
      id: `release-${Date.now()}`,
      release_date: '',
      release_type: 'percentage',
      release_percentage: 0,
      penalty_applies: false,
      notes: ''
    }
    const updated = [...releases, newRelease]
    setReleases(updated)
    onUpdate(updated)
  }

  const removeRelease = (id: string) => {
    const updated = releases.filter(r => r.id !== id)
    setReleases(updated)
    onUpdate(updated)
  }

  const updateRelease = (id: string, field: keyof Release, value: any) => {
    const updated = releases.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    )
    setReleases(updated)
    onUpdate(updated)
  }

  const suggestReleaseSchedule = () => {
    if (!allocation.valid_from || !allocation.total_quantity) return

    const startDate = new Date(allocation.valid_from)
    const totalQuantity = allocation.total_quantity

    const suggestedReleases: Release[] = [
      {
        id: `release-${Date.now()}-1`,
        release_date: new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        release_type: 'percentage',
        release_percentage: 50,
        release_quantity: Math.floor(totalQuantity * 0.5),
        penalty_applies: false,
        notes: '1st cut-off: 90 days before arrival - no penalty'
      },
      {
        id: `release-${Date.now()}-2`,
        release_date: new Date(startDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        release_type: 'percentage',
        release_percentage: 25,
        release_quantity: Math.floor(totalQuantity * 0.25),
        penalty_applies: false,
        notes: '2nd cut-off: 60 days before arrival - no penalty'
      },
      {
        id: `release-${Date.now()}-3`,
        release_date: new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        release_type: 'remaining',
        penalty_applies: true,
        notes: 'Final cut-off: 30 days before arrival - attrition penalties apply'
      }
    ]

    setReleases(suggestedReleases)
    onUpdate(suggestedReleases)
    setShowSuggestions(false)
  }

  const calculateReleasedQuantity = () => {
    return releases.reduce((sum, release) => {
      if (release.release_type === 'quantity' && release.release_quantity) {
        return sum + release.release_quantity
      } else if (release.release_type === 'percentage' && release.release_percentage) {
        return sum + Math.floor((allocation.total_quantity * release.release_percentage) / 100)
      }
      return sum
    }, 0)
  }

  const calculateRemainingQuantity = () => {
    const released = calculateReleasedQuantity()
    return allocation.total_quantity - released
  }

  const getReleaseTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return 'bg-blue-100 text-blue-800'
      case 'quantity': return 'bg-green-100 text-green-800'
      case 'remaining': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalQuantity = allocation.total_quantity || 0
  const releasedQuantity = calculateReleasedQuantity()
  const remainingQuantity = calculateRemainingQuantity()

  return (
    <div className="space-y-4">
      {/* Timeline View */}
      {releases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Timeline View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Contract: {allocation.valid_from} to {allocation.valid_to}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex-1 bg-muted rounded-full h-2 relative">
                  {releases.map((release, index) => {
                    const percentage = release.release_type === 'percentage' 
                      ? release.release_percentage || 0 
                      : release.release_type === 'quantity' 
                        ? ((release.release_quantity || 0) / totalQuantity) * 100
                        : 0
                    
                    return (
                      <div
                        key={release.id}
                        className={cn(
                          "absolute top-0 h-2 rounded-full",
                          release.penalty_applies ? "bg-destructive" : "bg-primary"
                        )}
                        style={{
                          left: `${index * 20}%`,
                          width: `${Math.min(percentage, 20)}%`
                        }}
                      />
                    )
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {releasedQuantity}/{totalQuantity} released
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Suggestions */}
      {!showSuggestions && releases.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-medium mb-2">Smart Release Schedule</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started with industry-standard release dates
              </p>
              <Button onClick={suggestReleaseSchedule} size="sm">
                Suggest Release Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Release List */}
      <div className="space-y-3">
        {releases.map((release, index) => (
          <Card key={release.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Release #{index + 1}
                  <Badge className={getReleaseTypeColor(release.release_type)}>
                    {release.release_type}
                  </Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRelease(release.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Release Date</Label>
                  <Input
                    type="date"
                    value={release.release_date}
                    onChange={(e) => updateRelease(release.id, 'release_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Release Type</Label>
                  <Select 
                    value={release.release_type} 
                    onValueChange={(value) => updateRelease(release.id, 'release_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="quantity">Specific Quantity</SelectItem>
                      <SelectItem value="remaining">All Remaining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {release.release_type === 'percentage' && (
                <div className="space-y-2">
                  <Label>Percentage</Label>
                  <Input
                    type="number"
                    value={release.release_percentage || ''}
                    onChange={(e) => {
                      const percentage = parseFloat(e.target.value) || 0
                      updateRelease(release.id, 'release_percentage', percentage)
                      updateRelease(release.id, 'release_quantity', Math.floor((totalQuantity * percentage) / 100))
                    }}
                    placeholder="50"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    ({Math.floor((totalQuantity * (release.release_percentage || 0)) / 100)} of {totalQuantity} units)
                  </p>
                </div>
              )}

              {release.release_type === 'quantity' && (
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={release.release_quantity || ''}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 0
                      updateRelease(release.id, 'release_quantity', quantity)
                      updateRelease(release.id, 'release_percentage', totalQuantity > 0 ? Math.round((quantity / totalQuantity) * 100) : 0)
                    }}
                    placeholder="15"
                    max={totalQuantity}
                  />
                  <p className="text-xs text-muted-foreground">
                    ({Math.round(((release.release_quantity || 0) / totalQuantity) * 100)}% of total)
                  </p>
                </div>
              )}

              {release.release_type === 'remaining' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-purple-800">
                    <CheckCircle className="h-4 w-4" />
                    Will release all remaining inventory
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id={`penalty-${release.id}`}
                  checked={release.penalty_applies}
                  onCheckedChange={(checked) => updateRelease(release.id, 'penalty_applies', checked)}
                />
                <Label htmlFor={`penalty-${release.id}`}>
                  Penalty applies after this date
                </Label>
                {release.penalty_applies && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Attrition Risk
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={release.notes || ''}
                  onChange={(e) => updateRelease(release.id, 'notes', e.target.value)}
                  placeholder="e.g., 1st cut-off - no penalty"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Release Button */}
      <Button onClick={addRelease} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Release Date
      </Button>

      {/* Summary */}
      {releases.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{releasedQuantity}</div>
                <div className="text-xs text-muted-foreground">Released</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">{remainingQuantity}</div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">
                  {totalQuantity > 0 ? Math.round((releasedQuantity / totalQuantity) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Released</div>
              </div>
            </div>
            
            {releases.length > 0 && !releases.some(r => r.release_type === 'remaining') && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  ⚠️ Final release not set - consider adding a "remaining" release
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

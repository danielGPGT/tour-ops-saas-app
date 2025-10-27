'use client'

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { format, addDays, differenceInDays } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, TrendingUp } from 'lucide-react'

export interface DailyRate {
  date: string
  day_of_week: string
  price: number
  pricing_tier: 'off_peak' | 'standard' | 'peak' | 'super_peak'
  event_context?: string
  occupancy_pricing?: {
    [occupancy: number]: number // e.g., { 2: 1000, 3: 1200, 4: 1400 }
  }
}

interface DailyRatesEditorProps {
  validFrom: Date
  validTo: Date
  basePrice: number
  onChange?: (rates: Record<string, DailyRate>) => void
  existingRates?: Record<string, DailyRate>
}

const PRICING_TIERS = {
  off_peak: {
    name: 'Off Peak',
    multiplier: 0.5,
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  standard: {
    name: 'Standard',
    multiplier: 1.0,
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  peak: {
    name: 'Peak',
    multiplier: 1.5,
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  super_peak: {
    name: 'Super Peak',
    multiplier: 2.0,
    color: 'bg-red-100 text-red-800 border-red-300'
  }
}

export const DailyRatesEditor = forwardRef<{ save: () => Record<string, DailyRate> }, DailyRatesEditorProps>(
  ({ validFrom, validTo, basePrice, existingRates }, ref) => {
  const [rates, setRates] = useState<DailyRate[]>([])
  const [basePriceInput, setBasePriceInput] = useState(basePrice)

  // Expose save method to parent
  useImperativeHandle(ref, () => ({
    save: () => {
      const ratesMap: Record<string, DailyRate> = {}
      rates.forEach(rate => {
        ratesMap[rate.date] = rate
      })
      return ratesMap
    }
  }))

  // Generate date range
  useEffect(() => {
    const generatedRates: DailyRate[] = []
    const start = new Date(validFrom)
    const end = new Date(validTo)
    
    let currentDate = new Date(start)
    
    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      
      // Use existing rate or create new one
      const existing = existingRates?.[dateStr]
      if (existing) {
        generatedRates.push(existing)
      } else {
        generatedRates.push({
          date: dateStr,
          day_of_week: format(currentDate, 'EEEE'),
          price: basePrice,
          pricing_tier: 'standard',
          event_context: ''
        })
      }
      
      currentDate = addDays(currentDate, 1)
    }
    
    setRates(generatedRates)
  }, [validFrom, validTo, basePrice, existingRates])

  // Update rates when base price changes
  useEffect(() => {
    if (basePriceInput !== basePrice) {
      setRates(prevRates => prevRates.map(rate => ({
        ...rate,
        price: basePriceInput * PRICING_TIERS[rate.pricing_tier].multiplier
      })))
    }
  }, [basePriceInput, basePrice])

  // Expose save function to parent via ref (don't call onChange in useEffect)

  const updatePrice = (date: string, newPrice: number) => {
    setRates(rates.map(rate =>
      rate.date === date ? { ...rate, price: newPrice } : rate
    ))
  }

  const updateTier = (date: string, tier: 'off_peak' | 'standard' | 'peak' | 'super_peak') => {
    const multiplier = PRICING_TIERS[tier].multiplier
    setRates(rates.map(rate =>
      rate.date === date 
        ? { ...rate, pricing_tier: tier, price: basePriceInput * multiplier }
        : rate
    ))
  }

  const updateEventContext = (date: string, context: string) => {
    setRates(rates.map(rate =>
      rate.date === date ? { ...rate, event_context: context } : rate
    ))
  }

  const applyPattern = (pattern: Record<string, number>) => {
    setRates(rates.map(rate => ({
      ...rate,
      price: basePriceInput * (pattern[rate.date] || 1.0)
    })))
  }

  const applyGMPattern = () => {
    applyPattern({
      // Monaco GP Weekend pattern
      // Adjust dates based on your actual event dates
      [format(addDays(validFrom, 0), 'yyyy-MM-dd')]: 0.5,  // Pre-event
      [format(addDays(validFrom, 1), 'yyyy-MM-dd')]: 1.5,  // Peak
      [format(addDays(validFrom, 2), 'yyyy-MM-dd')]: 1.5,  // Peak
      [format(addDays(validFrom, 3), 'yyyy-MM-dd')]: 2.0,  // Super peak
      [format(addDays(validFrom, 4), 'yyyy-MM-dd')]: 1.0,  // Standard
      [format(addDays(validFrom, 5), 'yyyy-MM-dd')]: 0.5,  // Off-peak
    })
  }

  const totalValue = rates.reduce((sum, r) => sum + r.price, 0)
  const averagePrice = rates.length > 0 ? totalValue / rates.length : 0
  const minPrice = Math.min(...rates.map(r => r.price))
  const maxPrice = Math.max(...rates.map(r => r.price))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Daily Rates</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={applyGMPattern}
          >
            Apply GP Pattern
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-3">
        {/* Base Price */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label className="text-sm mb-0">Base Price:</Label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">£</span>
              <Input
                type="number"
                step="0.01"
                value={basePriceInput}
                onChange={(e) => setBasePriceInput(parseFloat(e.target.value) || 0)}
                className="w-24 h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-muted rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Total Nights</div>
            <div className="text-xl font-bold">{rates.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total Value</div>
            <div className="text-xl font-bold">£{totalValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Average/Night</div>
            <div className="text-xl font-bold">£{Math.round(averagePrice)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Price Range</div>
            <div className="text-xl font-bold">£{minPrice}-£{maxPrice}</div>
          </div>
        </div>

                 {/* Individual Rates */}
        <div className="space-y-2">
          <Label className="text-sm">Night-by-Night Pricing</Label>
          
          <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
            {rates.map((rate, index) => {
              const tier = PRICING_TIERS[rate.pricing_tier]
              
              return (
                <div key={rate.date} className="p-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Date & Tier */}
                    <div className="w-32">
                      <div className="font-medium text-sm">
                        {format(new Date(rate.date), 'EEE, MMM d')}
                      </div>
                      <Badge variant="outline" className={`${tier.color} text-xs h-5 px-1.5`}>
                        {tier.name}
                      </Badge>
                    </div>
                    
                    {/* Price */}
                    <div className="w-24">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">£</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={rate.price}
                          onChange={(e) => updatePrice(rate.date, parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    
                    {/* Context */}
                    <div className="flex-1">
                      <Input
                        placeholder="Event context"
                        value={rate.event_context}
                        onChange={(e) => updateEventContext(rate.date, e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    
                    {/* Tier Select */}
                    <div className="w-32">
                      <Select
                        value={rate.pricing_tier}
                        onValueChange={(tier) => updateTier(rate.date, tier as any)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRICING_TIERS).map(([key, config]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              {config.name} ({config.multiplier}x)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRates(rates.map(rate => ({
                ...rate,
                pricing_tier: 'standard' as const,
                price: basePriceInput
              })))
            }}
          >
            Reset All to Standard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

DailyRatesEditor.displayName = 'DailyRatesEditor'

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  MoreHorizontal
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface SupplierAvailability {
  supplierId: number;
  supplierName: string;
  available: number;
  quantity: number;
  cost: number;
  margin: number;
  priority: number;
  stopSell: boolean;
  blackout: boolean;
  inventoryModel: string;
}

interface CalendarDay {
  date: string;
  sellingPrice: number;
  currency: string;
  totalAvailable: number;
  totalQuantity: number;
  totalBooked: number;
  status: 'available' | 'low_inventory' | 'sold_out' | 'stop_sell' | 'blackout';
  recommendedSupplier: string | null;
  suppliers: SupplierAvailability[];
}

interface CalendarViewProps {
  productVariantId: number;
  productName: string;
  onDateSelect?: (date: Date, dayData: CalendarDay) => void;
}

export function CalendarView({ productVariantId, productName, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch calendar data when month changes
  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, productVariantId]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      
      const response = await fetch(`/api/availability/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    const dayData = calendarData.find(day => isSameDay(new Date(day.date), date));
    if (dayData) {
      setSelectedDay(dayData);
      onDateSelect?.(date, dayData);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'low_inventory':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'sold_out':
        return <XCircle className="h-3 w-3 text-red-600" />;
      case 'stop_sell':
        return <XCircle className="h-3 w-3 text-gray-600" />;
      case 'blackout':
        return <XCircle className="h-3 w-3 text-gray-800" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'low_inventory':
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case 'sold_out':
        return <Badge className="bg-red-100 text-red-800">Sold Out</Badge>;
      case 'stop_sell':
        return <Badge className="bg-gray-100 text-gray-800">Stop Sell</Badge>;
      case 'blackout':
        return <Badge className="bg-gray-100 text-gray-800">Blackout</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getDayData = (date: Date): CalendarDay | null => {
    return calendarData.find(day => isSameDay(new Date(day.date), date)) || null;
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Add empty cells for days before the month starts
  const firstDay = startOfMonth(currentMonth);
  const startingDayOfWeek = firstDay.getDay();
  const emptyCells = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {productName} - Availability Calendar
              </CardTitle>
              <CardDescription>
                Master rates with supplier breakdown
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} className="p-2" />
            ))}

            {/* Calendar days */}
            {monthDays.map(date => {
              const dayData = getDayData(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isCurrentDay = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors",
                    isCurrentMonth ? "hover:bg-muted/50" : "opacity-50",
                    isCurrentDay && "ring-2 ring-primary",
                    dayData && dayData.status === 'sold_out' && "bg-red-50",
                    dayData && dayData.status === 'low_inventory' && "bg-yellow-50",
                    dayData && dayData.status === 'available' && "bg-green-50"
                  )}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                >
                  {dayData && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-medium",
                          isCurrentDay && "text-primary font-bold"
                        )}>
                          {format(date, 'd')}
                        </span>
                        {getStatusIcon(dayData.status)}
                      </div>
                      
                      <div className="text-xs">
                        <div className="font-medium text-primary">
                          {formatCurrency(dayData.sellingPrice, dayData.currency)}
                        </div>
                        <div className="text-muted-foreground">
                          {dayData.totalAvailable}/{dayData.totalQuantity}
                        </div>
                        <div className="text-muted-foreground">
                          {dayData.suppliers.length} supplier{dayData.suppliers.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDay && format(new Date(selectedDay.date), 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              Detailed availability breakdown by supplier
            </DialogDescription>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-6">
              {/* Overview */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(selectedDay.sellingPrice, selectedDay.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">Selling Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {selectedDay.totalAvailable}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {selectedDay.totalBooked}
                      </div>
                      <div className="text-sm text-muted-foreground">Booked</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Availability</span>
                      <span>{selectedDay.totalAvailable}/{selectedDay.totalQuantity}</span>
                    </div>
                    <Progress 
                      value={(selectedDay.totalAvailable / selectedDay.totalQuantity) * 100} 
                      className="mt-1"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedDay.status)}
                      {getStatusBadge(selectedDay.status)}
                    </div>
                    {selectedDay.recommendedSupplier && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3" />
                        Recommended: {selectedDay.recommendedSupplier}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Supplier Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedDay.suppliers.map((supplier, index) => (
                      <div key={supplier.supplierId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{supplier.supplierName}</h4>
                            {supplier.priority === 1 && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            {supplier.stopSell && (
                              <Badge variant="destructive" className="text-xs">Stop Sell</Badge>
                            )}
                            {supplier.blackout && (
                              <Badge variant="secondary" className="text-xs">Blackout</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Priority {supplier.priority}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Cost</div>
                            <div className="font-medium">
                              {formatCurrency(supplier.cost, selectedDay.currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Margin</div>
                            <div className="font-medium text-green-600">
                              {formatCurrency(supplier.margin, selectedDay.currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Available</div>
                            <div className="font-medium">
                              {supplier.available}/{supplier.quantity}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Model</div>
                            <div className="font-medium capitalize">
                              {supplier.inventoryModel}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Availability</span>
                            <span>{supplier.available}/{supplier.quantity}</span>
                          </div>
                          <Progress 
                            value={supplier.quantity > 0 ? (supplier.available / supplier.quantity) * 100 : 0} 
                            className="h-2"
                          />
                        </div>

                        {supplier.inventoryModel === 'freesale' && (
                          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            Freesale - Unlimited availability
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedDay(null)}>
                  Close
                </Button>
                {selectedDay.status === 'available' && (
                  <Button>
                    Quick Book
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

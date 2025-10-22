/**
 * Calculate margin between cost and price
 */
export function calculateMargin(cost: number, price: number): number {
  return price - cost
}

/**
 * Calculate margin percentage
 */
export function calculateMarginPercentage(cost: number, price: number): number {
  if (cost === 0) return 0
  return ((price - cost) / cost) * 100
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  
  const diffTime = checkOutDate.getTime() - checkInDate.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate total price for a booking item
 */
export function calculateTotal(
  unitPrice: number, 
  quantity: number, 
  nights: number = 1
): number {
  return unitPrice * quantity * nights
}

/**
 * Calculate total with taxes
 */
export function calculateTotalWithTax(
  subtotal: number,
  taxRate: number
): number {
  return subtotal + (subtotal * taxRate / 100)
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Calculate occupancy rate
 */
export function calculateOccupancyRate(
  totalRooms: number,
  occupiedRooms: number
): number {
  if (totalRooms === 0) return 0
  return (occupiedRooms / totalRooms) * 100
}

/**
 * Calculate average daily rate (ADR)
 */
export function calculateADR(totalRevenue: number, occupiedRooms: number): number {
  if (occupiedRooms === 0) return 0
  return totalRevenue / occupiedRooms
}

/**
 * Calculate revenue per available room (RevPAR)
 */
export function calculateRevPAR(totalRevenue: number, totalRooms: number): number {
  if (totalRooms === 0) return 0
  return totalRevenue / totalRooms
}

/**
 * Round to specified decimal places
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Date helper utilities for tour operator system
 */

/**
 * Check if a date is within a valid range
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  return checkDate >= start && checkDate <= end
}

/**
 * Get array of dates between two dates
 */
export function getDateRange(startDate: Date | string, endDate: Date | string): Date[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const dates: Date[] = []
  
  const currentDate = new Date(start)
  while (currentDate <= end) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

/**
 * Get day of week for a date
 */
export function getDayOfWeek(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dateObj.getDay()]
}

/**
 * Get abbreviated day of week
 */
export function getDayOfWeekShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[dateObj.getDay()]
}

/**
 * Check if date is a weekend
 */
export function isWeekend(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const day = dateObj.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

/**
 * Check if date is a weekday
 */
export function isWeekday(date: Date | string): boolean {
  return !isWeekend(date)
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date | string, days: number): Date {
  return addDays(date, -days)
}

/**
 * Get start of month
 */
export function getStartOfMonth(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
}

/**
 * Get end of month
 */
export function getEndOfMonth(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0)
}

/**
 * Get start of week (Monday)
 */
export function getStartOfWeek(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const day = dateObj.getDay()
  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(dateObj.setDate(diff))
}

/**
 * Get end of week (Sunday)
 */
export function getEndOfWeek(date: Date | string): Date {
  const startOfWeek = getStartOfWeek(date)
  return addDays(startOfWeek, 6)
}

/**
 * Check if two date ranges overlap
 */
export function dateRangesOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2
  
  return s1 <= e2 && s2 <= e1
}

/**
 * Get business days between two dates (excluding weekends)
 */
export function getBusinessDays(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  let count = 0
  const current = new Date(start)
  
  while (current <= end) {
    if (isWeekday(current)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

/**
 * Format date for API calls (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString().split('T')[0]
}

/**
 * Parse API date string to Date object
 */
export function parseAPIDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z')
}

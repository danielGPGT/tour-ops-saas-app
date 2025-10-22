/**
 * Generate unique booking reference
 */
export function generateBookingReference(prefix?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const prefixStr = prefix ? prefix.toUpperCase() : 'BK'
  return `${prefixStr}${timestamp}${random}`
}

/**
 * Generate supplier code from name
 */
export function generateSupplierCode(name: string): string {
  // Remove special characters and convert to uppercase
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase()
  
  // Split into words and take first 2-3 characters of each
  const words = cleaned.split(/\s+/).filter(word => word.length > 0)
  
  if (words.length === 1) {
    // Single word - take first 6 characters
    return words[0].substring(0, 6)
  } else if (words.length === 2) {
    // Two words - take first 3 characters of each
    return words[0].substring(0, 3) + words[1].substring(0, 3)
  } else {
    // Multiple words - take first 2 characters of each, max 6 total
    return words.slice(0, 3).map(word => word.substring(0, 2)).join('')
  }
}

/**
 * Generate contract number
 */
export function generateContractNumber(supplierCode: string): string {
  const year = new Date().getFullYear()
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  
  return `CON-${supplierCode}-${year}${month}-${random}`
}

/**
 * Generate product code
 */
export function generateProductCode(name: string, type: string): string {
  const typePrefix = type.substring(0, 2).toUpperCase()
  const nameCode = generateSupplierCode(name)
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  
  return `${typePrefix}-${nameCode}-${random}`
}

/**
 * Generate customer reference
 */
export function generateCustomerReference(customerType: 'B2C' | 'B2B'): string {
  const prefix = customerType === 'B2B' ? 'CORP' : 'CUST'
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  
  return `${prefix}-${timestamp}${random}`
}

/**
 * Generate allocation code
 */
export function generateAllocationCode(contractNumber: string, productCode: string): string {
  const contractShort = contractNumber.split('-')[1] // Get supplier code from contract
  const productShort = productCode.split('-')[1] // Get product code
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  
  return `ALL-${contractShort}-${productShort}-${random}`
}

/**
 * Generate unique ID (alternative to UUID for shorter references)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

/**
 * Validate reference format
 */
export function validateReferenceFormat(reference: string, type: 'booking' | 'contract' | 'customer'): boolean {
  const patterns = {
    booking: /^BK[A-Z0-9]{8,}$/,
    contract: /^CON-[A-Z0-9]{3,}-\d{6}-[A-Z0-9]{4}$/,
    customer: /^(CORP|CUST)-[A-Z0-9]{8,}$/
  }
  
  return patterns[type].test(reference)
}

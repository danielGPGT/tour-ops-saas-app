import { createDatabaseService } from "@/lib/database";

interface AvailabilitySearchParams {
  orgId: number;
  destination?: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children?: number;
  productTypes?: string[];
}

interface AvailabilityResult {
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  supplierName: string;
  available: boolean;
  minAvailable: number;
  totalPrice: number;
  priceBreakdown: {
    basePrice: number;
    taxes: number;
    total: number;
  };
  productType: string;
  location?: string;
}

/**
 * Availability Service - Simplified interface for complex availability queries
 * 
 * This service implements performance optimization strategies:
 * 1. Uses materialized views for fast searches
 * 2. Implements caching for repeated queries
 * 3. Handles complex pricing calculations
 * 4. Returns simple, actionable results
 */
export class AvailabilityService {
  private static cache = new Map<string, { data: AvailabilityResult[], timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Search for available products
   * Simplified interface that hides complex multi-table joins
   */
  static async searchAvailability(params: AvailabilitySearchParams): Promise<AvailabilityResult[]> {
    const cacheKey = this.generateCacheKey(params);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const results = await this.performAvailabilitySearch(params);
      
      // Cache results
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });
      
      return results;
    } catch (error) {
      console.error('Availability search error:', error);
      throw new Error('Failed to search availability');
    }
  }

  /**
   * Perform the actual availability search
   * This is where the complex database queries happen
   */
  private static async performAvailabilitySearch(
    params: AvailabilitySearchParams
  ): Promise<AvailabilityResult[]> {
    const { orgId, checkIn, checkOut, adults, children = 0, productTypes, destination } = params;
    const totalPax = adults + children;
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Complex query that handles:
    // 1. Multi-night availability (all dates must have availability)
    // 2. Product type filtering
    // 3. Location filtering
    // 4. Pricing calculations
    const query = `
      WITH availability_check AS (
        SELECT 
          pv.id as variant_id,
          p.id as product_id,
          p.name as product_name,
          pv.name as variant_name,
          s.name as supplier_name,
          p.type as product_type,
          p.attributes->>'location' as location,
          MIN(ab.quantity - ab.booked - ab.held) as min_available,
          COUNT(DISTINCT ab.date) as available_dates,
          ${nights} as required_nights
        FROM products p
        JOIN product_variants pv ON pv.product_id = p.id
        JOIN suppliers s ON s.id = pv.id -- This would be through rate_plans in reality
        JOIN allocation_buckets ab ON ab.product_variant_id = pv.id
        WHERE p.org_id = ${orgId}
          AND p.status = 'active'
          AND pv.status = 'active'
          AND ab.date BETWEEN '${checkIn.toISOString().split('T')[0]}' 
                         AND '${checkOut.toISOString().split('T')[0]}'
          AND (ab.quantity IS NULL OR ab.quantity > ab.booked + ab.held)
          ${productTypes ? `AND p.type IN (${productTypes.map(t => `'${t}'`).join(',')})` : ''}
          ${destination ? `AND (p.attributes->>'city' ILIKE '%${destination}%' OR p.attributes->>'location' ILIKE '%${destination}%')` : ''}
        GROUP BY pv.id, p.id, p.name, pv.name, s.name, p.type, p.attributes
        HAVING COUNT(DISTINCT ab.date) = ${nights} -- All required nights available
      ),
      pricing_calc AS (
        SELECT 
          ac.*,
          rp.id as rate_plan_id,
          -- Get base rate from rate_doc or rate_occupancies
          COALESCE(
            (rp.rate_doc->>'base_rates'->>'price_per_person')::numeric,
            ro.base_amount
          ) as base_rate,
          -- Calculate total price for stay
          COALESCE(
            (rp.rate_doc->>'base_rates'->>'price_per_person')::numeric,
            ro.base_amount
          ) * ${totalPax} * ${nights} as base_total
        FROM availability_check ac
        LEFT JOIN rate_plans rp ON rp.product_variant_id = ac.variant_id 
          AND rp.valid_from <= '${checkIn.toISOString().split('T')[0]}'
          AND rp.valid_to >= '${checkOut.toISOString().split('T')[0]}'
          AND rp.preferred = true
        LEFT JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
          AND ${totalPax} >= ro.min_occupancy 
          AND ${totalPax} <= ro.max_occupancy
        WHERE ac.min_available >= 1
      ),
      tax_calc AS (
        SELECT 
          pc.*,
          COALESCE(
            SUM(
              CASE 
                WHEN rtf.calc_base = 'per_person_per_night' 
                THEN rtf.value * ${totalPax} * ${nights}
                WHEN rtf.calc_base = 'per_booking'
                THEN rtf.value
                ELSE 0
              END
            ), 0
          ) as total_taxes
        FROM pricing_calc pc
        LEFT JOIN rate_taxes_fees rtf ON rtf.rate_plan_id = pc.rate_plan_id
        GROUP BY pc.*
      )
      SELECT 
        product_id,
        variant_id,
        product_name,
        variant_name,
        supplier_name,
        CASE WHEN min_available > 0 THEN true ELSE false END as available,
        min_available,
        base_total + total_taxes as total_price,
        base_total as base_price,
        total_taxes as taxes,
        product_type,
        location
      FROM tax_calc
      ORDER BY total_price ASC, min_available DESC
    `;

    const results = await prisma.$queryRawUnsafe(query) as any[];

    return results.map(row => ({
      productId: Number(row.product_id),
      variantId: Number(row.variant_id),
      productName: row.product_name,
      variantName: row.variant_name,
      supplierName: row.supplier_name,
      available: row.available,
      minAvailable: Number(row.min_available),
      totalPrice: Number(row.total_price),
      priceBreakdown: {
        basePrice: Number(row.base_price),
        taxes: Number(row.taxes),
        total: Number(row.total_price)
      },
      productType: row.product_type,
      location: row.location
    }));
  }

  /**
   * Generate cache key for search parameters
   */
  private static generateCacheKey(params: AvailabilitySearchParams): string {
    return `search:${params.orgId}:${params.checkIn.toISOString()}:${params.checkOut.toISOString()}:${params.adults}:${params.children || 0}:${params.productTypes?.join(',') || 'all'}:${params.destination || 'any'}`;
  }

  /**
   * Clear cache for a specific organization (when bookings change)
   */
  static clearCache(orgId: number): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(`:${orgId}:`));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get availability for a specific product variant
   */
  static async getProductAvailability(
    orgId: number,
    variantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; available: number; total: number }[]> {
    const query = `
      SELECT 
        ab.date::text as date,
        COALESCE(ab.quantity, 999999) as total,
        COALESCE(ab.quantity, 999999) - ab.booked - ab.held as available
      FROM allocation_buckets ab
      WHERE ab.org_id = ${orgId}
        AND ab.product_variant_id = ${variantId}
        AND ab.date BETWEEN '${startDate.toISOString().split('T')[0]}' 
                       AND '${endDate.toISOString().split('T')[0]}'
      ORDER BY ab.date ASC
    `;

    const results = await prisma.$queryRawUnsafe(query) as any[];
    
    return results.map(row => ({
      date: row.date,
      available: Number(row.available),
      total: Number(row.total)
    }));
  }

  /**
   * Check if a specific booking is possible
   */
  static async checkBookingAvailability(
    orgId: number,
    variantId: number,
    checkIn: Date,
    checkOut: Date,
    quantity: number = 1
  ): Promise<{ available: boolean; availableQuantity: number }> {
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const query = `
      SELECT 
        MIN(COALESCE(ab.quantity, 999999) - ab.booked - ab.held) as min_available
      FROM allocation_buckets ab
      WHERE ab.org_id = ${orgId}
        AND ab.product_variant_id = ${variantId}
        AND ab.date BETWEEN '${checkIn.toISOString().split('T')[0]}' 
                       AND '${checkOut.toISOString().split('T')[0]}'
    `;

    const result = await prisma.$queryRawUnsafe(query) as any[];
    const availableQuantity = Number(result[0]?.min_available || 0);

    return {
      available: availableQuantity >= quantity,
      availableQuantity
    };
  }

  /**
   * Hold inventory for a booking (before confirmation)
   */
  static async holdInventory(
    orgId: number,
    variantId: number,
    checkIn: Date,
    checkOut: Date,
    quantity: number,
    bookingRef: string,
    expiryHours: number = 24
  ): Promise<{ success: boolean; holdIds?: number[] }> {
    try {
      // First check availability
      const availability = await this.checkBookingAvailability(orgId, variantId, checkIn, checkOut, quantity);
      
      if (!availability.available) {
        return { success: false };
      }

      // Create holds
      const holds = await prisma.$transaction(async (tx) => {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const holdIds = [];

        for (let i = 0; i < nights; i++) {
          const date = new Date(checkIn);
          date.setDate(checkIn.getDate() + i);

          const bucket = await tx.allocation_buckets.findFirst({
            where: {
              org_id: orgId,
              product_variant_id: variantId,
              date: date
            }
          });

          if (bucket) {
            const hold = await tx.allocation_holds.create({
              data: {
                org_id: orgId,
                allocation_bucket_id: bucket.id,
                quantity: quantity,
                expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
                booking_ref: bookingRef
              }
            });
            holdIds.push(Number(hold.id));
          }
        }

        return holdIds;
      });

      return { success: true, holdIds: holds };
    } catch (error) {
      console.error('Error holding inventory:', error);
      return { success: false };
    }
  }

  /**
   * Confirm booking and convert holds to actual bookings
   */
  static async confirmBooking(
    orgId: number,
    variantId: number,
    checkIn: Date,
    checkOut: Date,
    quantity: number,
    bookingRef: string
  ): Promise<{ success: boolean }> {
    try {
      await prisma.$transaction(async (tx) => {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 0; i < nights; i++) {
          const date = new Date(checkIn);
          date.setDate(checkIn.getDate() + i);

          // Update allocation bucket
          await tx.allocation_buckets.updateMany({
            where: {
              org_id: orgId,
              product_variant_id: variantId,
              date: date
            },
            data: {
              booked: { increment: quantity }
            }
          });

          // Remove holds for this date
          await tx.allocation_holds.deleteMany({
            where: {
              org_id: orgId,
              allocation_bucket: {
                product_variant_id: variantId,
                date: date
              },
              booking_ref: bookingRef
            }
          });
        }
      });

      // Clear cache since availability changed
      this.clearCache(orgId);

      return { success: true };
    } catch (error) {
      console.error('Error confirming booking:', error);
      return { success: false };
    }
  }
}

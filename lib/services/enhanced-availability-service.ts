import { prisma } from '@/lib/db-connection';

export interface MasterRate {
  rate_plan_id: number;
  selling_price: number;
  currency: string;
  valid_from: Date;
  valid_to: Date;
}

export interface SupplierRate {
  rate_plan_id: number;
  supplier_id: number;
  supplier_name: string;
  cost_price: number;
  currency: string;
  priority: number;
  valid_from: Date;
  valid_to: Date;
  inventory_model: string;
}

export interface SupplierAvailability {
  supplier_id: number;
  supplier_name: string;
  available: number;
  quantity: number;
  booked: number;
  held: number;
  cost: number;
  margin: number;
  priority: number;
  stop_sell: boolean;
  blackout: boolean;
  inventory_model: string;
}

export interface CalendarDay {
  date: string;
  selling_price: number;
  currency: string;
  total_available: number;
  total_quantity: number;
  total_booked: number;
  status: 'available' | 'low_inventory' | 'sold_out' | 'stop_sell' | 'blackout';
  recommended_supplier: string | null;
  suppliers: SupplierAvailability[];
}

export interface BookingSupplierSelection {
  supplier_id: number;
  supplier_name: string;
  unit_cost: number;
  selling_price: number;
  margin: number;
  available: number;
  priority: number;
}

export class EnhancedAvailabilityService {
  /**
   * Get master rate (selling price) for a product variant
   */
  static async getMasterRate(
    orgId: number,
    productVariantId: number,
    date: Date = new Date()
  ): Promise<MasterRate | null> {
    const result = await prisma.$queryRaw<MasterRate[]>`
      SELECT 
        rp.id as rate_plan_id,
        ro.base_amount as selling_price,
        rp.currency,
        rp.valid_from,
        rp.valid_to
      FROM rate_plans rp
      JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
      WHERE rp.org_id = ${orgId}
        AND rp.product_variant_id = ${productVariantId}
        AND rp.supplier_id IS NULL  -- Master rate
        AND rp.preferred = true
        AND rp.valid_from <= ${date}
        AND rp.valid_to >= ${date}
      ORDER BY rp.priority DESC
      LIMIT 1
    `;

    return result[0] || null;
  }

  /**
   * Get all supplier rates (cost prices) for a product variant
   */
  static async getSupplierRates(
    orgId: number,
    productVariantId: number,
    date: Date = new Date()
  ): Promise<SupplierRate[]> {
    return await prisma.$queryRaw<SupplierRate[]>`
      SELECT 
        rp.id as rate_plan_id,
        rp.supplier_id,
        s.name as supplier_name,
        ro.base_amount as cost_price,
        rp.currency,
        rp.priority,
        rp.valid_from,
        rp.valid_to,
        rp.inventory_model
      FROM rate_plans rp
      JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
      JOIN suppliers s ON s.id = rp.supplier_id
      WHERE rp.org_id = ${orgId}
        AND rp.product_variant_id = ${productVariantId}
        AND rp.supplier_id IS NOT NULL  -- Supplier rate
        AND rp.valid_from <= ${date}
        AND rp.valid_to >= ${date}
      ORDER BY rp.priority DESC, ro.base_amount ASC
    `;
  }

  /**
   * Get calendar data for a product variant showing master rate + supplier breakdown
   */
  static async getCalendarData(
    orgId: number,
    productVariantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]> {
    const result = await prisma.$queryRaw<CalendarDay[]>`
      WITH master_rate AS (
        -- Get the selling price
        SELECT 
          rp.product_variant_id,
          ro.base_amount as selling_price,
          rp.currency
        FROM rate_plans rp
        JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
        WHERE rp.org_id = ${orgId}
          AND rp.product_variant_id = ${productVariantId}
          AND rp.supplier_id IS NULL
          AND rp.preferred = true
        LIMIT 1
      ),
      supplier_inventory AS (
        -- Get availability by supplier for each date
        SELECT 
          ab.date,
          ab.supplier_id,
          s.name as supplier_name,
          ab.quantity,
          ab.booked,
          ab.held,
          (COALESCE(ab.quantity, 999999) - ab.booked - ab.held) as available,
          ab.unit_cost,
          ab.stop_sell,
          ab.blackout,
          COALESCE(rp.priority, 100) as supplier_priority,
          rp.inventory_model
        FROM allocation_buckets ab
        JOIN suppliers s ON s.id = ab.supplier_id
        LEFT JOIN rate_plans rp 
          ON rp.supplier_id = ab.supplier_id 
          AND rp.product_variant_id = ab.product_variant_id
          AND rp.valid_from <= ab.date
          AND rp.valid_to >= ab.date
        WHERE ab.org_id = ${orgId}
          AND ab.product_variant_id = ${productVariantId}
          AND ab.date BETWEEN ${startDate} AND ${endDate}
      )
      SELECT 
        si.date::text,
        mr.selling_price,
        mr.currency,
        
        -- Total availability across all suppliers
        SUM(si.available) as total_available,
        SUM(COALESCE(si.quantity, 999999)) as total_quantity,
        SUM(si.booked) as total_booked,
        
        -- Overall status
        CASE 
          WHEN BOOL_OR(si.stop_sell) THEN 'stop_sell'
          WHEN BOOL_OR(si.blackout) THEN 'blackout'
          WHEN SUM(si.available) = 0 THEN 'sold_out'
          WHEN SUM(si.available) < 5 THEN 'low_inventory'
          ELSE 'available'
        END as status,
        
        -- Best margin supplier (highest priority with availability)
        (
          SELECT si2.supplier_name
          FROM supplier_inventory si2
          WHERE si2.date = si.date
            AND si2.available > 0
            AND si2.stop_sell = false
            AND si2.blackout = false
          ORDER BY si2.supplier_priority DESC
          LIMIT 1
        ) as recommended_supplier,
        
        -- Supplier breakdown (as JSON)
        jsonb_agg(
          jsonb_build_object(
            'supplierId', si.supplier_id,
            'supplierName', si.supplier_name,
            'available', si.available,
            'quantity', si.quantity,
            'cost', si.unit_cost,
            'margin', mr.selling_price - si.unit_cost,
            'priority', si.supplier_priority,
            'stopSell', si.stop_sell,
            'blackout', si.blackout,
            'inventoryModel', si.inventory_model
          )
          ORDER BY si.supplier_priority DESC
        ) as suppliers
        
      FROM supplier_inventory si
      CROSS JOIN master_rate mr
      GROUP BY si.date, mr.selling_price, mr.currency
      ORDER BY si.date
    `;

    return result;
  }

  /**
   * Find the best supplier for a booking request
   */
  static async findBestSupplier(
    orgId: number,
    productVariantId: number,
    date: Date,
    quantity: number
  ): Promise<BookingSupplierSelection | null> {
    const result = await prisma.$queryRaw<BookingSupplierSelection[]>`
      WITH master_rate AS (
        SELECT ro.base_amount as selling_price
        FROM rate_plans rp
        JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
        WHERE rp.org_id = ${orgId}
          AND rp.product_variant_id = ${productVariantId}
          AND rp.supplier_id IS NULL
        LIMIT 1
      ),
      available_suppliers AS (
        SELECT 
          ab.supplier_id,
          s.name as supplier_name,
          (COALESCE(ab.quantity, 999999) - ab.booked - ab.held) as available,
          ab.unit_cost,
          COALESCE(rp.priority, 100) as priority,
          rp.rate_doc->>'auto_select' as auto_select
        FROM allocation_buckets ab
        JOIN suppliers s ON s.id = ab.supplier_id
        LEFT JOIN rate_plans rp 
          ON rp.supplier_id = ab.supplier_id 
          AND rp.product_variant_id = ab.product_variant_id
          AND rp.valid_from <= ab.date
          AND rp.valid_to >= ab.date
        WHERE ab.org_id = ${orgId}
          AND ab.product_variant_id = ${productVariantId}
          AND ab.date = ${date}
          AND (ab.quantity IS NULL OR ab.quantity - ab.booked - ab.held >= ${quantity})
          AND ab.stop_sell = false
          AND ab.blackout = false
      )
      SELECT 
        as1.supplier_id,
        as1.supplier_name,
        as1.unit_cost,
        mr.selling_price,
        (mr.selling_price - as1.unit_cost) as margin,
        as1.available,
        as1.priority
      FROM available_suppliers as1
      CROSS JOIN master_rate mr
      WHERE as1.auto_select::boolean = true OR as1.auto_select IS NULL
      ORDER BY as1.priority DESC, as1.unit_cost ASC
      LIMIT 1
    `;

    return result[0] || null;
  }

  /**
   * Get availability summary for a product variant
   */
  static async getAvailabilitySummary(
    orgId: number,
    productVariantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total_days: number;
    available_days: number;
    sold_out_days: number;
    low_inventory_days: number;
    total_available: number;
    total_booked: number;
    average_margin: number;
  }> {
    const result = await prisma.$queryRaw<{
      total_days: number;
      available_days: number;
      sold_out_days: number;
      low_inventory_days: number;
      total_available: number;
      total_booked: number;
      average_margin: number;
    }[]>`
      WITH master_rate AS (
        SELECT ro.base_amount as selling_price
        FROM rate_plans rp
        JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
        WHERE rp.org_id = ${orgId}
          AND rp.product_variant_id = ${productVariantId}
          AND rp.supplier_id IS NULL
        LIMIT 1
      ),
      daily_summary AS (
        SELECT 
          ab.date,
          SUM(COALESCE(ab.quantity, 999999) - ab.booked - ab.held) as available,
          SUM(ab.booked) as booked,
          SUM(ab.unit_cost) as total_cost,
          COUNT(DISTINCT ab.supplier_id) as supplier_count
        FROM allocation_buckets ab
        WHERE ab.org_id = ${orgId}
          AND ab.product_variant_id = ${productVariantId}
          AND ab.date BETWEEN ${startDate} AND ${endDate}
        GROUP BY ab.date
      )
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN available > 0 THEN 1 END) as available_days,
        COUNT(CASE WHEN available = 0 THEN 1 END) as sold_out_days,
        COUNT(CASE WHEN available > 0 AND available < 5 THEN 1 END) as low_inventory_days,
        SUM(available) as total_available,
        SUM(booked) as total_booked,
        AVG(mr.selling_price - (total_cost / supplier_count)) as average_margin
      FROM daily_summary ds
      CROSS JOIN master_rate mr
    `;

    return result[0] || {
      total_days: 0,
      available_days: 0,
      sold_out_days: 0,
      low_inventory_days: 0,
      total_available: 0,
      total_booked: 0,
      average_margin: 0
    };
  }

  /**
   * Update allocation after booking
   */
  static async updateAllocationAfterBooking(
    orgId: number,
    productVariantId: number,
    supplierId: number,
    date: Date,
    quantity: number
  ): Promise<boolean> {
    try {
      await prisma.$executeRaw`
        UPDATE allocation_buckets
        SET booked = booked + ${quantity},
            updated_at = NOW()
        WHERE org_id = ${orgId}
          AND product_variant_id = ${productVariantId}
          AND supplier_id = ${supplierId}
          AND date = ${date}
      `;

      return true;
    } catch (error) {
      console.error('Failed to update allocation after booking:', error);
      return false;
    }
  }

  /**
   * Create new allocation for a supplier
   */
  static async createAllocation(
    orgId: number,
    productVariantId: number,
    supplierId: number,
    startDate: Date,
    endDate: Date,
    quantity: number,
    unitCost?: number
  ): Promise<boolean> {
    try {
      // Get unit cost from supplier rate if not provided
      let cost = unitCost;
      if (!cost) {
        const supplierRate = await prisma.$queryRaw<{ base_amount: number }[]>`
          SELECT ro.base_amount
          FROM rate_plans rp
          JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
          WHERE rp.org_id = ${orgId}
            AND rp.product_variant_id = ${productVariantId}
            AND rp.supplier_id = ${supplierId}
            AND rp.valid_from <= ${startDate}
            AND rp.valid_to >= ${endDate}
          ORDER BY rp.priority DESC
          LIMIT 1
        `;
        cost = supplierRate[0]?.base_amount || 0;
      }

      // Generate date range
      const dates = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create allocation buckets
      const allocationData = dates.map(date => ({
        org_id: orgId,
        product_variant_id: productVariantId,
        supplier_id: supplierId,
        date: date,
        allocation_type: 'committed' as const,
        quantity: quantity,
        booked: 0,
        held: 0,
        unit_cost: cost || 0,
        currency: 'USD',
        committed_cost: true
      }));

      await prisma.allocation_buckets.createMany({
        data: allocationData
      });

      return true;
    } catch (error) {
      console.error('Failed to create allocation:', error);
      return false;
    }
  }
}

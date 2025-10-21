import { createClient } from '@/utils/supabase/server';

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

export class SupabaseAvailabilityService {
  /**
   * Get master rate (selling price) for a product variant
   */
  static async getMasterRate(
    orgId: number,
    productVariantId: number,
    date: Date = new Date()
  ): Promise<MasterRate | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_master_rate', {
      p_org_id: orgId,
      p_product_variant_id: productVariantId,
      p_date: date.toISOString().split('T')[0]
    });

    if (error) {
      console.error('Error getting master rate:', error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Get all supplier rates (cost prices) for a product variant
   */
  static async getSupplierRates(
    orgId: number,
    productVariantId: number,
    date: Date = new Date()
  ): Promise<SupplierRate[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_supplier_rates', {
      p_org_id: orgId,
      p_product_variant_id: productVariantId,
      p_date: date.toISOString().split('T')[0]
    });

    if (error) {
      console.error('Error getting supplier rates:', error);
      return [];
    }

    return data || [];
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
    const supabase = await createClient();
    
    // First get the master rate
    const masterRate = await this.getMasterRate(orgId, productVariantId, startDate);
    if (!masterRate) {
      console.error('No master rate found for product variant:', productVariantId);
      return [];
    }

    // Get allocation data with supplier information
    const { data: allocations, error } = await supabase
      .from('allocation_buckets')
      .select(`
        date,
        supplier_id,
        quantity,
        booked,
        held,
        unit_cost,
        stop_sell,
        blackout,
        suppliers!inner (
          name
        ),
        rate_plans (
          priority,
          inventory_model
        )
      `)
      .eq('org_id', orgId)
      .eq('product_variant_id', productVariantId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date')
      .order('suppliers(name)');

    if (error) {
      console.error('Error getting calendar data:', error);
      return [];
    }

    // Group allocations by date and build calendar data
    const calendarData: CalendarDay[] = [];
    const groupedByDate = allocations.reduce((acc: any, allocation: any) => {
      const date = allocation.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(allocation);
      return acc;
    }, {});

    Object.entries(groupedByDate).forEach(([date, dayAllocations]: [string, any]) => {
      const suppliers: SupplierAvailability[] = dayAllocations.map((alloc: any) => {
        const available = (alloc.quantity || 999999) - alloc.booked - alloc.held;
        const margin = masterRate.selling_price - (alloc.unit_cost || 0);
        
        return {
          supplier_id: alloc.supplier_id,
          supplier_name: alloc.suppliers.name,
          available,
          quantity: alloc.quantity || 999999,
          booked: alloc.booked,
          held: alloc.held,
          cost: alloc.unit_cost || 0,
          margin,
          priority: alloc.rate_plans?.[0]?.priority || 100,
          stop_sell: alloc.stop_sell,
          blackout: alloc.blackout,
          inventory_model: alloc.rate_plans?.[0]?.inventory_model || 'committed'
        };
      });

      const totalAvailable = suppliers.reduce((sum, s) => sum + s.available, 0);
      const totalQuantity = suppliers.reduce((sum, s) => sum + s.quantity, 0);
      const totalBooked = suppliers.reduce((sum, s) => sum + s.booked, 0);

      let status: CalendarDay['status'] = 'available';
      if (totalAvailable === 0) {
        status = 'sold_out';
      } else if (totalAvailable < 5) {
        status = 'low_inventory';
      } else if (suppliers.some(s => s.stop_sell)) {
        status = 'stop_sell';
      } else if (suppliers.some(s => s.blackout)) {
        status = 'blackout';
      }

      // Find recommended supplier (highest priority with availability)
      const availableSuppliers = suppliers.filter(s => s.available > 0 && !s.stop_sell && !s.blackout);
      const recommendedSupplier = availableSuppliers.length > 0 
        ? availableSuppliers.sort((a, b) => b.priority - a.priority)[0].supplier_name
        : null;

      calendarData.push({
        date,
        selling_price: masterRate.selling_price,
        currency: masterRate.currency,
        total_available: totalAvailable,
        total_quantity: totalQuantity,
        total_booked: totalBooked,
        status,
        recommended_supplier: recommendedSupplier,
        suppliers: suppliers.sort((a, b) => b.priority - a.priority)
      });
    });

    return calendarData.sort((a, b) => a.date.localeCompare(b.date));
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
    const supabase = await createClient();
    
    // Get master rate
    const masterRate = await this.getMasterRate(orgId, productVariantId, date);
    if (!masterRate) {
      return null;
    }

    // Get available suppliers for this date
    const { data: allocations, error } = await supabase
      .from('allocation_buckets')
      .select(`
        supplier_id,
        quantity,
        booked,
        held,
        unit_cost,
        stop_sell,
        blackout,
        suppliers!inner (
          name
        ),
        rate_plans (
          priority
        )
      `)
      .eq('org_id', orgId)
      .eq('product_variant_id', productVariantId)
      .eq('date', date.toISOString().split('T')[0])
      .eq('stop_sell', false)
      .eq('blackout', false)
      .order('rate_plans(priority)', { ascending: false });

    if (error) {
      console.error('Error finding best supplier:', error);
      return null;
    }

    // Find suppliers with sufficient availability
    const availableSuppliers = allocations
      .map(alloc => ({
        supplier_id: alloc.supplier_id,
        supplier_name: alloc.suppliers.name,
        available: (alloc.quantity || 999999) - alloc.booked - alloc.held,
        unit_cost: alloc.unit_cost || 0,
        priority: alloc.rate_plans?.[0]?.priority || 100
      }))
      .filter(supplier => supplier.available >= quantity)
      .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    if (availableSuppliers.length === 0) {
      return null;
    }

    const bestSupplier = availableSuppliers[0];
    return {
      supplier_id: bestSupplier.supplier_id,
      supplier_name: bestSupplier.supplier_name,
      unit_cost: bestSupplier.unit_cost,
      selling_price: masterRate.selling_price,
      margin: masterRate.selling_price - bestSupplier.unit_cost,
      available: bestSupplier.available,
      priority: bestSupplier.priority
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
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('allocation_buckets')
      .update({ 
        booked: supabase.rpc('increment_booked', { 
          bucket_id: supabase
            .from('allocation_buckets')
            .select('id')
            .eq('org_id', orgId)
            .eq('product_variant_id', productVariantId)
            .eq('supplier_id', supplierId)
            .eq('date', date.toISOString().split('T')[0])
            .single()
            .then(result => result.data?.id),
          quantity 
        }),
        updated_at: new Date().toISOString()
      })
      .eq('org_id', orgId)
      .eq('product_variant_id', productVariantId)
      .eq('supplier_id', supplierId)
      .eq('date', date.toISOString().split('T')[0]);

    if (error) {
      console.error('Failed to update allocation after booking:', error);
      return false;
    }

    return true;
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
    const supabase = await createClient();
    
    try {
      // Get unit cost from supplier rate if not provided
      let cost = unitCost;
      if (!cost) {
        const { data: supplierRate } = await supabase
          .from('rate_plans')
          .select(`
            rate_occupancies!inner (
              base_amount
            )
          `)
          .eq('org_id', orgId)
          .eq('product_variant_id', productVariantId)
          .eq('supplier_id', supplierId)
          .gte('valid_from', startDate.toISOString().split('T')[0])
          .lte('valid_to', endDate.toISOString().split('T')[0])
          .order('priority', { ascending: false })
          .limit(1)
          .single();

        cost = supplierRate?.rate_occupancies?.[0]?.base_amount || 0;
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
        date: date.toISOString().split('T')[0],
        allocation_type: 'committed',
        quantity: quantity,
        booked: 0,
        held: 0,
        unit_cost: cost || 0,
        currency: 'USD',
        committed_cost: true
      }));

      const { error } = await supabase
        .from('allocation_buckets')
        .insert(allocationData);

      if (error) {
        console.error('Failed to create allocation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to create allocation:', error);
      return false;
    }
  }
}

import { createClient } from '@/utils/supabase/server';

export interface PricingRequest {
  productVariantId: number;
  supplierId?: number;
  checkIn: Date;
  checkOut: Date;
  occupancy: number;
  roomType?: string;
}

export interface PricingResponse {
  totalCost: number;
  breakdown: {
    blockNights: number;
    extraBeforeNights: number;
    extraAfterNights: number;
    blockCost: number;
    extraBeforeCost: number;
    extraAfterCost: number;
  };
  rates: {
    blockRate: number;
    extraBeforeRate: number;
    extraAfterRate: number;
  };
}

export class JsonbPricingService {
  /**
   * Calculate total cost for a stay including block and extra nights
   */
  static async calculateStayCost(request: PricingRequest): Promise<PricingResponse> {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('calculate_stay_cost', {
      p_product_variant_id: request.productVariantId,
      p_supplier_id: request.supplierId,
      p_check_in: request.checkIn.toISOString().split('T')[0],
      p_check_out: request.checkOut.toISOString().split('T')[0],
      p_occupancy: request.occupancy,
      p_room_type: request.roomType || 'standard'
    });

    if (error) {
      console.error('Error calculating stay cost:', error);
      throw new Error('Failed to calculate stay cost');
    }

    return data;
  }

  /**
   * Get pricing for a specific occupancy and room type
   */
  static async getPricing(
    productVariantId: number,
    supplierId?: number,
    rateType: 'supplier_rate' | 'master_rate' = 'supplier_rate'
  ) {
    const supabase = createClient();
    
    let query = supabase
      .from('rate_plans')
      .select('pricing, rate_type, supplier_id')
      .eq('product_variant_id', productVariantId)
      .eq('rate_type', rateType);

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    } else {
      query = query.is('supplier_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error getting pricing:', error);
      throw new Error('Failed to get pricing');
    }

    return data;
  }

  /**
   * Get all available rates for a product variant
   */
  static async getAvailableRates(productVariantId: number, checkIn: Date, checkOut: Date) {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('rate_plans')
      .select(`
        id,
        supplier_id,
        rate_type,
        pricing,
        priority,
        inventory_model,
        suppliers (
          id,
          name
        )
      `)
      .eq('product_variant_id', productVariantId)
      .lte('valid_from', checkIn.toISOString().split('T')[0])
      .gte('valid_to', checkOut.toISOString().split('T')[0])
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error getting available rates:', error);
      throw new Error('Failed to get available rates');
    }

    return data;
  }

  /**
   * Get block allocations for a product variant
   */
  static async getBlockAllocations(productVariantId: number, supplierId?: number) {
    const supabase = createClient();
    
    let query = supabase
      .from('allocation_buckets')
      .select(`
        id,
        date,
        block_type,
        block_start_date,
        block_end_date,
        quantity,
        booked,
        held,
        allocation_type,
        min_stay,
        max_stay,
        suppliers (
          id,
          name
        )
      `)
      .eq('product_variant_id', productVariantId);

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
      console.error('Error getting block allocations:', error);
      throw new Error('Failed to get block allocations');
    }

    return data;
  }

  /**
   * Get margin calculation for a booking
   */
  static async calculateMargin(
    productVariantId: number,
    supplierId: number,
    checkIn: Date,
    checkOut: Date,
    occupancy: number,
    roomType: string = 'standard'
  ) {
    // Get supplier cost
    const supplierCost = await this.calculateStayCost({
      productVariantId,
      supplierId,
      checkIn,
      checkOut,
      occupancy,
      roomType
    });

    // Get master rate (selling price)
    const masterCost = await this.calculateStayCost({
      productVariantId,
      supplierId: undefined, // NULL for master rates
      checkIn,
      checkOut,
      occupancy,
      roomType
    });

    const margin = masterCost.totalCost - supplierCost.totalCost;
    const marginPercentage = (margin / masterCost.totalCost) * 100;

    return {
      supplierCost: supplierCost.totalCost,
      sellingPrice: masterCost.totalCost,
      margin,
      marginPercentage,
      breakdown: {
        supplier: supplierCost.breakdown,
        master: masterCost.breakdown
      }
    };
  }
}

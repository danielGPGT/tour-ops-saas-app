import { prisma } from '@/lib/db-connection';
import { EnhancedAvailabilityService, BookingSupplierSelection } from './enhanced-availability-service';

export interface BookingItem {
  productVariantId: number;
  serviceDate: Date;
  quantity: number;
  adults: number;
  children: number;
  passengers: Passenger[];
  specialRequests?: string;
}

export interface Passenger {
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  nationality?: string;
  isLead: boolean;
}

export interface BookingRequest {
  orgId: number;
  reference: string;
  channel: string;
  currency: string;
  items: BookingItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
      specialRequests?: string;
}

export interface BookingResult {
  success: boolean;
  bookingId?: number;
  bookingReference?: string;
  totalCost: number;
  totalPrice: number;
  totalMargin: number;
  items: BookingItemResult[];
  error?: string;
}

export interface BookingItemResult {
  productVariantId: number;
  supplierId: number;
  supplierName: string;
  serviceDate: Date;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  margin: number;
  totalCost: number;
  totalPrice: number;
  totalMargin: number;
  bookingItemId: number;
}

export class BookingService {
  /**
   * Create a booking with automatic supplier selection
   */
  static async createBooking(request: BookingRequest): Promise<BookingResult> {
    const transaction = await prisma.$transaction(async (tx) => {
      try {
        // Step 1: Validate availability and select suppliers
        const itemResults: BookingItemResult[] = [];
        let totalCost = 0;
        let totalPrice = 0;
        let totalMargin = 0;

        for (const item of request.items) {
          // Find best supplier for this item
          const supplierSelection = await EnhancedAvailabilityService.findBestSupplier(
            request.orgId,
            item.productVariantId,
            item.serviceDate,
            item.quantity
          );

          if (!supplierSelection) {
            throw new Error(`No available supplier found for product variant ${item.productVariantId} on ${item.serviceDate.toISOString()}`);
          }

          // Get master rate (selling price)
          const masterRate = await EnhancedAvailabilityService.getMasterRate(
            request.orgId,
            item.productVariantId,
            item.serviceDate
          );

          if (!masterRate) {
            throw new Error(`No master rate found for product variant ${item.productVariantId}`);
          }

          // Calculate totals
          const unitCost = supplierSelection.unit_cost;
          const unitPrice = masterRate.selling_price;
          const margin = unitPrice - unitCost;
          const itemTotalCost = unitCost * item.quantity;
          const itemTotalPrice = unitPrice * item.quantity;
          const itemTotalMargin = margin * item.quantity;

          itemResults.push({
            productVariantId: item.productVariantId,
            supplierId: supplierSelection.supplier_id,
            supplierName: supplierSelection.supplier_name,
            serviceDate: item.serviceDate,
            quantity: item.quantity,
            unitCost,
            unitPrice,
            margin,
            totalCost: itemTotalCost,
            totalPrice: itemTotalPrice,
            totalMargin: itemTotalMargin,
            bookingItemId: 0 // Will be set after creation
          });

          totalCost += itemTotalCost;
          totalPrice += itemTotalPrice;
          totalMargin += itemTotalMargin;
        }

        // Step 2: Create booking
        const booking = await tx.bookings.create({
          data: {
            org_id: request.orgId,
            reference: request.reference,
            channel: request.channel,
            status: 'confirmed',
            total_cost: totalCost,
            total_price: totalPrice,
            total_margin: totalMargin,
            currency: request.currency
          }
        });

        // Step 3: Create booking items and update allocations
        for (let i = 0; i < request.items.length; i++) {
          const item = request.items[i];
          const itemResult = itemResults[i];

          // Get product variant details
          const productVariant = await tx.product_variants.findUnique({
            where: { id: item.productVariantId },
            include: { products: true }
          });

          if (!productVariant) {
            throw new Error(`Product variant ${item.productVariantId} not found`);
          }

          // Create booking item
          const bookingItem = await tx.booking_items.create({
            data: {
              org_id: request.orgId,
              booking_id: booking.id,
              product_variant_id: item.productVariantId,
              supplier_id: itemResult.supplierId,
              state: 'confirmed',
              service_start: item.serviceDate,
              service_end: item.serviceDate, // For single-day services
              quantity: item.quantity,
              pax_breakdown: {
                adults: item.adults,
                children: item.children,
                total: item.adults + item.children
              },
              unit_cost: itemResult.unitCost,
              unit_price: itemResult.unitPrice,
              margin: itemResult.margin,
              product_variant_name: productVariant.name,
              supplier_name: itemResult.supplierName,
              rate_plan_code: 'AUTO-SELECTED'
            }
          });

          itemResults[i].bookingItemId = bookingItem.id;

          // Update allocation
          await EnhancedAvailabilityService.updateAllocationAfterBooking(
            request.orgId,
            item.productVariantId,
            itemResult.supplierId,
            item.serviceDate,
            item.quantity
          );
        }

        // Step 4: Create passengers
        const passengerPromises = request.items.map(item =>
          item.passengers.map(passenger =>
            tx.passengers.create({
              data: {
                org_id: request.orgId,
                booking_id: booking.id,
                full_name: passenger.fullName,
                dob: passenger.dateOfBirth,
                gender: undefined, // Could be added to interface
                passport: undefined, // Could be added to interface
                nationality: passenger.nationality,
                is_lead: passenger.isLead,
                assignment: {
                  email: passenger.email,
                  phone: passenger.phone
                }
              }
            })
          )
        );

        await Promise.all(passengerPromises.flat());

      return {
        success: true,
          bookingId: booking.id,
          bookingReference: booking.reference,
          totalCost,
          totalPrice,
          totalMargin,
          items: itemResults
      };

    } catch (error) {
        console.error('Booking creation failed:', error);
        throw error;
      }
    });

    return transaction;
  }

  /**
   * Validate booking availability before creation
   */
  static async validateBookingAvailability(request: BookingRequest): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    supplierSelections: BookingSupplierSelection[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const supplierSelections: BookingSupplierSelection[] = [];

    try {
      for (const item of request.items) {
        // Check if supplier is available
        const supplierSelection = await EnhancedAvailabilityService.findBestSupplier(
          request.orgId,
          item.productVariantId,
          item.serviceDate,
          item.quantity
        );

        if (!supplierSelection) {
          errors.push(`No available supplier found for ${item.productVariantId} on ${item.serviceDate.toISOString()}`);
          continue;
        }

        supplierSelections.push(supplierSelection);

        // Check if quantity is available
        if (supplierSelection.available < item.quantity) {
          errors.push(`Insufficient availability for ${item.productVariantId} on ${item.serviceDate.toISOString()}. Available: ${supplierSelection.available}, Requested: ${item.quantity}`);
          continue;
        }

        // Check if margin is acceptable
        const marginPercent = (supplierSelection.margin / supplierSelection.selling_price) * 100;
        if (marginPercent < 10) {
          warnings.push(`Low margin for ${item.productVariantId} on ${item.serviceDate.toISOString()}: ${marginPercent.toFixed(1)}%`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        supplierSelections
      };

    } catch (error) {
      console.error('Availability validation failed:', error);
      return {
        valid: false,
        errors: ['Failed to validate availability'],
        warnings: [],
        supplierSelections: []
      };
    }
  }

  /**
   * Get booking details with supplier information
   */
  static async getBookingDetails(orgId: number, bookingId: number): Promise<{
    booking: any;
    items: any[];
    passengers: any[];
    supplierBreakdown: any[];
  } | null> {
    try {
      const booking = await prisma.bookings.findUnique({
        where: { id: bookingId, org_id: orgId },
        include: {
          booking_items: {
            include: {
        product_variants: {
                include: { products: true }
              },
              suppliers: true
            }
          },
          passengers: true
        }
      });

      if (!booking) {
        return null;
      }

      // Calculate supplier breakdown
      const supplierBreakdown = booking.booking_items.reduce((acc: any[], item) => {
        const existing = acc.find(s => s.supplier_id === item.supplier_id);
        if (existing) {
          existing.total_cost += item.unit_cost * item.quantity;
          existing.total_price += item.unit_price * item.quantity;
          existing.total_margin += item.margin * item.quantity;
          existing.item_count += 1;
        } else {
          acc.push({
            supplier_id: item.supplier_id,
            supplier_name: item.supplier_name,
            total_cost: item.unit_cost * item.quantity,
            total_price: item.unit_price * item.quantity,
            total_margin: item.margin * item.quantity,
            item_count: 1
          });
        }
        return acc;
      }, []);

      return {
        booking,
        items: booking.booking_items,
        passengers: booking.passengers,
        supplierBreakdown
      };

    } catch (error) {
      console.error('Failed to get booking details:', error);
      return null;
    }
  }

  /**
   * Cancel a booking and release allocations
   */
  static async cancelBooking(orgId: number, bookingId: number, reason?: string): Promise<boolean> {
    const transaction = await prisma.$transaction(async (tx) => {
      try {
        // Get booking with items
        const booking = await tx.bookings.findUnique({
          where: { id: bookingId, org_id: orgId },
          include: { booking_items: true }
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        if (booking.status === 'cancelled') {
          throw new Error('Booking is already cancelled');
        }

        // Release allocations
        for (const item of booking.booking_items) {
          await tx.allocation_buckets.updateMany({
      where: {
        org_id: orgId,
              product_variant_id: item.product_variant_id,
              supplier_id: item.supplier_id,
              date: item.service_start
            },
            data: {
              booked: { decrement: item.quantity }
            }
          });
        }

        // Update booking status
        await tx.bookings.update({
          where: { id: bookingId },
      data: {
            status: 'cancelled',
        updated_at: new Date()
      }
    });

        // Update booking items status
        await tx.booking_items.updateMany({
          where: { booking_id: bookingId },
          data: { state: 'cancelled' }
        });

        return true;

      } catch (error) {
        console.error('Failed to cancel booking:', error);
        throw error;
      }
    });

    return transaction;
  }
}
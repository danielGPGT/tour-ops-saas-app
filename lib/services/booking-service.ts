import { prisma } from "@/lib/db";
import { AvailabilityService } from "./availability-service";

interface SimpleBookingData {
  orgId: number;
  reference: string;
  channel: string;
  currency: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  items: {
    variantId: number;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children?: number;
    roomPreferences?: {
      roomType?: 'single' | 'double' | 'twin' | 'triple' | 'quad' | 'suite';
      beddingPreference?: string;
      floorPreference?: string;
      specialRequests?: string;
    };
  }[];
  passengers: {
    fullName: string;
    age?: number;
    isLead?: boolean;
    dietary?: string;
    medical?: string;
    passport?: string;
  }[];
}

interface BookingResult {
  success: boolean;
  bookingId?: number;
  reference?: string;
  totalPrice?: number;
  error?: string;
}

/**
 * Booking Service - Simplified interface for complex booking operations
 * 
 * This service implements the "Workflow-Driven" pattern by:
 * 1. Taking simple booking data
 * 2. Handling complex database operations automatically
 * 3. Creating room assignments and passenger links
 * 4. Managing inventory and pricing
 * 5. Returning simple success/failure results
 */
export class BookingService {
  /**
   * Create a booking from simple data
   * Handles all the complex schema operations behind the scenes
   */
  static async createBooking(bookingData: SimpleBookingData): Promise<BookingResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Validate availability for all items
        for (const item of bookingData.items) {
          const availability = await AvailabilityService.checkBookingAvailability(
            bookingData.orgId,
            item.variantId,
            item.checkIn,
            item.checkOut,
            1 // quantity
          );

          if (!availability.available) {
            throw new Error(`Not enough availability for item ${item.variantId}`);
          }
        }

        // 2. Calculate total price for the booking
        const totalPrice = await this.calculateBookingTotal(bookingData);

        // 3. Create the booking record
        const booking = await tx.bookings.create({
          data: {
            org_id: bookingData.orgId,
            reference: bookingData.reference,
            channel: bookingData.channel,
            status: 'confirmed',
            total_cost: totalPrice.cost,
            total_price: totalPrice.price,
            total_margin: totalPrice.margin,
            currency: bookingData.currency
          }
        });

        // 4. Create booking items
        const bookingItems = [];
        for (const item of bookingData.items) {
          const bookingItem = await tx.booking_items.create({
            data: {
              org_id: bookingData.orgId,
              booking_id: booking.id,
              product_variant_id: item.variantId,
              state: 'confirmed',
              service_start: item.checkIn,
              service_end: item.checkOut,
              quantity: 1,
              pax_breakdown: {
                adults: item.adults,
                children: item.children || 0
              },
              unit_cost: totalPrice.cost / bookingData.items.length,
              unit_price: totalPrice.price / bookingData.items.length,
              margin: totalPrice.margin / bookingData.items.length,
              product_variant_name: await this.getVariantName(item.variantId),
              supplier_name: await this.getSupplierName(item.variantId)
            }
          });
          bookingItems.push(bookingItem);

          // 5. Create room assignments for accommodation items
          if (await this.isAccommodationItem(item.variantId)) {
            await this.createRoomAssignment(tx, bookingData.orgId, bookingItem.id, item);
          }

          // 6. Update inventory
          await AvailabilityService.confirmBooking(
            bookingData.orgId,
            item.variantId,
            item.checkIn,
            item.checkOut,
            1
          );
        }

        // 7. Create passengers and link to rooms
        await this.createPassengersAndRoomAssignments(tx, bookingData, booking.id);

        return {
          booking,
          totalPrice: totalPrice.price
        };
      });

      // Clear availability cache
      AvailabilityService.clearCache(bookingData.orgId);

      return {
        success: true,
        bookingId: result.booking.id,
        reference: result.booking.reference,
        totalPrice: result.totalPrice
      };

    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Calculate total price for the booking
   */
  private static async calculateBookingTotal(bookingData: SimpleBookingData) {
    let totalCost = 0;
    let totalPrice = 0;

    for (const item of bookingData.items) {
      // Get rate plan for this variant
      const ratePlan = await prisma.rate_plans.findFirst({
        where: {
          product_variant_id: item.variantId,
          valid_from: { lte: item.checkIn },
          valid_to: { gte: item.checkOut },
          preferred: true
        },
        include: {
          rate_occupancies: true
        }
      });

      if (!ratePlan) {
        throw new Error(`No rate plan found for variant ${item.variantId}`);
      }

      // Calculate base price
      const totalPax = item.adults + (item.children || 0);
      const nights = Math.ceil((item.checkOut.getTime() - item.checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      // Find appropriate occupancy rate
      const occupancy = ratePlan.rate_occupancies.find(
        ro => totalPax >= ro.min_occupancy && totalPax <= ro.max_occupancy
      );

      if (!occupancy) {
        throw new Error(`No occupancy rate found for ${totalPax} people`);
      }

      let basePrice = 0;
      switch (occupancy.pricing_model) {
        case 'fixed':
          basePrice = Number(occupancy.base_amount) * totalPax * nights;
          break;
        case 'base_plus_pax':
          const additionalPax = Math.max(0, totalPax - occupancy.min_occupancy);
          basePrice = (Number(occupancy.base_amount) + (additionalPax * Number(occupancy.per_person_amount || 0))) * nights;
          break;
        case 'per_person':
          basePrice = Number(occupancy.base_amount) * totalPax * nights;
          break;
      }

      // Add taxes
      const taxes = await this.calculateTaxes(ratePlan.id, totalPax, nights);
      
      // Get cost from rate_doc
      const rateDoc = ratePlan.rate_doc as any;
      const costPerPerson = rateDoc?.base_rates?.cost_per_person || 0;
      const itemCost = costPerPerson * totalPax * nights;
      const itemPrice = basePrice + taxes;

      totalCost += itemCost;
      totalPrice += itemPrice;
    }

    return {
      cost: totalCost,
      price: totalPrice,
      margin: totalPrice - totalCost
    };
  }

  /**
   * Calculate taxes for a rate plan
   */
  private static async calculateTaxes(ratePlanId: number, totalPax: number, nights: number): Promise<number> {
    const taxes = await prisma.rate_taxes_fees.findMany({
      where: { rate_plan_id: ratePlanId }
    });

    let totalTaxes = 0;
    for (const tax of taxes) {
      switch (tax.calc_base) {
        case 'per_person_per_night':
          totalTaxes += Number(tax.value) * totalPax * nights;
          break;
        case 'per_booking':
          totalTaxes += Number(tax.value);
          break;
        case 'per_person':
          totalTaxes += Number(tax.value) * totalPax;
          break;
      }
    }

    return totalTaxes;
  }

  /**
   * Create room assignment for accommodation items
   */
  private static async createRoomAssignment(
    tx: any,
    orgId: number,
    bookingItemId: number,
    item: any
  ) {
    const roomType = item.roomPreferences?.roomType || 'double';
    
    const roomAssignment = await tx.room_assignments.create({
      data: {
        org_id: orgId,
        booking_item_id: bookingItemId,
        room_type: roomType,
        bedding_preference: item.roomPreferences?.beddingPreference || null,
        floor_preference: item.roomPreferences?.floorPreference || null,
        special_requests: item.roomPreferences?.specialRequests || null,
        status: 'requested'
      }
    });

    return roomAssignment;
  }

  /**
   * Create passengers and link them to room assignments
   */
  private static async createPassengersAndRoomAssignments(
    tx: any,
    bookingData: SimpleBookingData,
    bookingId: number
  ) {
    const passengers = [];
    
    // Create passengers
    for (const passengerData of bookingData.passengers) {
      const passenger = await tx.passengers.create({
        data: {
          org_id: bookingData.orgId,
          booking_id: bookingId,
          full_name: passengerData.fullName,
          age: passengerData.age || null,
          dietary: passengerData.dietary || null,
          medical: passengerData.medical || null,
          passport: passengerData.passport || null,
          is_lead: passengerData.isLead || false
        }
      });
      passengers.push(passenger);
    }

    // Link passengers to rooms for accommodation items
    const accommodationItems = await tx.booking_items.findMany({
      where: {
        booking_id: bookingId,
        product_variants: {
          products: {
            type: { in: ['hotel', 'accommodation'] }
          }
        }
      },
      include: {
        room_assignments: true
      }
    });

    for (const item of accommodationItems) {
      if (item.room_assignments.length > 0) {
        const roomAssignment = item.room_assignments[0];
        
        // Simple room assignment: put passengers in available rooms
        const passengersPerRoom = Math.ceil(passengers.length / accommodationItems.length);
        
        for (let i = 0; i < passengers.length; i++) {
          await tx.room_occupants.create({
            data: {
              org_id: bookingData.orgId,
              room_assignment_id: roomAssignment.id,
              passenger_id: passengers[i].id,
              is_lead: i === 0 // First passenger is lead
            }
          });
        }
      }
    }
  }

  /**
   * Helper methods
   */
  private static async getVariantName(variantId: number): Promise<string> {
    const variant = await prisma.product_variants.findUnique({
      where: { id: variantId },
      select: { name: true }
    });
    return variant?.name || 'Unknown';
  }

  private static async getSupplierName(variantId: number): Promise<string> {
    // This would typically go through rate_plans to get supplier
    // Simplified for this example
    return 'Supplier';
  }

  private static async isAccommodationItem(variantId: number): Promise<boolean> {
    const variant = await prisma.product_variants.findUnique({
      where: { id: variantId },
      include: {
        products: {
          select: { type: true }
        }
      }
    });
    
    return variant?.products.type === 'hotel' || variant?.products.type === 'accommodation';
  }

  /**
   * Generate rooming list for a booking
   */
  static async generateRoomingList(orgId: number, bookingId: number) {
    const roomingList = await prisma.room_assignments.findMany({
      where: {
        org_id: orgId,
        booking_items: {
          booking_id: bookingId
        }
      },
      include: {
        booking_items: {
          include: {
            bookings: true
          }
        },
        room_occupants: {
          include: {
            passengers: true
          }
        }
      }
    });

    return roomingList.map(room => ({
      roomNumber: room.room_number,
      roomType: room.room_type,
      beddingPreference: room.bedding_preference,
      floorPreference: room.floor_preference,
      specialRequests: room.special_requests,
      status: room.status,
      checkIn: room.booking_items.service_start,
      checkOut: room.booking_items.service_end,
      passengers: room.room_occupants.map(occupant => ({
        name: occupant.passengers.full_name,
        age: occupant.passengers.age,
        isLead: occupant.is_lead,
        dietary: occupant.passengers.dietary,
        medical: occupant.passengers.medical,
        passport: occupant.passengers.passport
      }))
    }));
  }

  /**
   * Update room assignment (when hotel confirms room numbers)
   */
  static async updateRoomAssignment(
    orgId: number,
    roomAssignmentId: number,
    updates: {
      roomNumber?: string;
      status?: 'confirmed' | 'checked_in' | 'checked_out';
    }
  ) {
    return await prisma.room_assignments.update({
      where: {
        id: roomAssignmentId,
        org_id: orgId
      },
      data: {
        room_number: updates.roomNumber,
        status: updates.status,
        updated_at: new Date()
      }
    });
  }
}

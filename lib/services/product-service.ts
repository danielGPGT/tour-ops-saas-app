import { createDatabaseService } from "@/lib/database";
import type { Product, ProductType, ProductOption } from "@/lib/types/database";

// Types for the new wizard data structure
interface WizardData {
  productType: 'accommodation' | 'activity' | 'transfer' | 'package';
  productName: string;
  supplier: {
    id?: number;
    name?: string;
    email?: string;
    phone?: string;
  };
  location?: string;
  roomType?: string;
  pricing: {
    cost: string;
    price: string;
    occupancy?: {
      single?: string;
      additional?: string;
    };
    taxes?: Array<{
      name: string;
      amount: string;
      type: string;
    }>;
  };
  availability: {
    model: 'fixed' | 'unlimited' | 'on-request';
    quantity?: number;
    sharedPool?: boolean;
    releaseTime?: string;
    dateFrom: string;
    dateTo: string;
  };
}

interface SimpleProductData {
  name: string;
  type: string;
  supplier: {
    name: string;
    id?: string;
  };
  costPerPerson: number;
  pricePerPerson: number;
  availability: {
    type: 'unlimited' | 'fixed' | 'on-request';
    quantity?: number;
    startDate?: Date;
    endDate?: Date;
  };
  settings: {
    inventoryModel: string;
    pricingModel: string;
    currency: string;
    channels: string[];
    markets: string[];
    cancellationPolicy?: any;
  };
}

/**
 * Product Service - Hides complex schema operations behind simple interface
 * 
 * This service implements the "Progressive Disclosure" pattern by:
 * 1. Taking simple user input
 * 2. Creating complex database structures automatically
 * 3. Applying opinionated defaults
 * 4. Returning success/failure to user
 */
export class ProductService {
  /**
   * Create a product from the new comprehensive wizard data
   * This is the main method that transforms wizard inputs into the complete database structure
   */
  static async createProductFromWizardData(
    wizardData: WizardData,
    session: { org_id: number; user_id: number }
  ): Promise<{ success: boolean; product?: any; message?: string; error?: string }> {
    const { org_id, user_id } = session;
    
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Create or get supplier
        const supplier = wizardData.supplier.id 
          ? await tx.suppliers.findUnique({ where: { id: wizardData.supplier.id } })
          : await tx.suppliers.create({
              data: {
                org_id,
                name: wizardData.supplier.name!,
                status: 'active',
                contact_info: {
                  email: wizardData.supplier.email,
                  phone: wizardData.supplier.phone
                }
              }
            });
        
        // 2. Auto-create contract (hidden from user)
        const contract = await tx.contracts.create({
          data: {
            org_id,
            supplier_id: supplier.id,
            reference: `AUTO-${Date.now()}`,
            status: 'active',
            contract_type: 'standard'
          }
        });
        
        // 3. Auto-create contract version
        const contractVersion = await tx.contract_versions.create({
          data: {
            org_id,
            contract_id: contract.id,
            version_number: 1,
            valid_from: new Date(wizardData.availability.dateFrom),
            valid_to: new Date(wizardData.availability.dateTo),
            cancellation_policy: this.getDefaultCancellationPolicy(),
            payment_policy: this.getDefaultPaymentPolicy(),
            terms: this.getDefaultTerms(),
            status: 'active'
          }
        });
        
        // 4. Create product
        const product = await tx.products.create({
          data: {
            org_id,
            name: wizardData.productName,
            type: wizardData.productType,
            status: 'active',
            attributes: {
              location: wizardData.location,
              created_via: 'wizard',
              wizard_version: 'v1'
            }
          }
        });
        
        // 5. Create product variant
        const variant = await tx.product_variants.create({
          data: {
            org_id,
            product_id: product.id,
            name: wizardData.roomType || 'Standard',
            attributes: {
              created_via: 'wizard'
            },
            status: 'active'
          }
        });
        
        // 6. Create rate plan
        const ratePlan = await tx.rate_plans.create({
          data: {
            org_id,
            product_variant_id: variant.id,
            supplier_id: supplier.id,
            contract_version_id: contractVersion.id,
            inventory_model: this.mapInventoryModel(wizardData.availability.model),
            currency: 'GBP', // from org settings
            markets: ['all'],
            channels: ['direct', 'agent'],
            valid_from: new Date(wizardData.availability.dateFrom),
            valid_to: new Date(wizardData.availability.dateTo),
            rate_doc: {
              base_cost: parseFloat(wizardData.pricing.cost),
              base_price: parseFloat(wizardData.pricing.price),
              created_from_wizard: true
            },
            status: 'active'
          }
        });
        
        // 7. Create rate season (single season for simple mode)
        const rateSeason = await tx.rate_seasons.create({
          data: {
            org_id,
            rate_plan_id: ratePlan.id,
            season_from: new Date(wizardData.availability.dateFrom),
            season_to: new Date(wizardData.availability.dateTo),
            dow_mask: 127, // all days
            min_pax: 1,
            max_pax: 4
          }
        });
        
        // 8. Create rate occupancies (your new flexible model)
        const occupancyData = [];
        
        // Single occupancy
        if (wizardData.pricing.occupancy?.single) {
          occupancyData.push({
            org_id,
            rate_plan_id: ratePlan.id,
            min_occupancy: 1,
            max_occupancy: 1,
            pricing_model: 'fixed',
            base_amount: parseFloat(wizardData.pricing.occupancy.single)
          });
        }
        
        // Base + additional person model
        occupancyData.push({
          org_id,
          rate_plan_id: ratePlan.id,
          min_occupancy: 2,
          max_occupancy: 4,
          pricing_model: 'base_plus_pax',
          base_amount: parseFloat(wizardData.pricing.price),
          per_person_amount: wizardData.pricing.occupancy?.additional 
            ? parseFloat(wizardData.pricing.occupancy.additional) 
            : 30 // default £30
        });
        
        await tx.rate_occupancies.createMany({
          data: occupancyData
        });
        
        // 9. Create taxes/fees
        if (wizardData.pricing.taxes && wizardData.pricing.taxes.length > 0) {
          await tx.rate_taxes_fees.createMany({
            data: wizardData.pricing.taxes
              .filter(tax => tax.name && tax.amount)
              .map(tax => ({
                org_id,
                rate_plan_id: ratePlan.id,
                name: tax.name,
                inclusive: false,
                calc_base: tax.type === 'per_person_per_night' ? 'per_person_per_night' : 'per_booking',
                amount_type: 'fixed',
                value: parseFloat(tax.amount)
              }))
          });
        }
        
        // 10. Create allocation buckets (one per day) or inventory pool
        if (wizardData.availability.model === 'committed') {
          const dates = this.generateDateRange(
            wizardData.availability.dateFrom,
            wizardData.availability.dateTo
          );
          
          // Create inventory pool if shared
          let inventoryPoolId = null;
          if (wizardData.availability.sharedPool) {
            const pool = await tx.inventory_pools.create({
              data: {
                org_id,
                supplier_id: supplier.id,
                name: `${wizardData.productName} Pool`,
                pool_type: 'shared'
              }
            });
            inventoryPoolId = pool.id;
          }
          
          await tx.allocation_buckets.createMany({
            data: dates.map(date => ({
              org_id,
              product_variant_id: variant.id,
              supplier_id: supplier.id,
              date: new Date(date),
              allocation_type: 'committed',
              quantity: wizardData.availability.quantity || 100,
              booked: 0,
              held: 0,
              inventory_pool_id: inventoryPoolId
            }))
          });
        }
        
        // 11. Track that this was created via wizard
        await tx.audit_logs.create({
          data: {
            org_id,
            user_id,
            action: 'product.created',
            entity_type: 'product',
            entity_id: product.id,
            changes: {
              method: 'wizard',
              wizard_data: wizardData
            }
          }
        });
        
        return {
          success: true,
          product,
          message: `✅ ${wizardData.productName} created successfully!`
        };
      });

    } catch (error) {
      console.error('Error creating product from wizard:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Create a product from simple wizard data (legacy method)
   * This method handles all the complex schema creation behind the scenes
   */
  static async createProductFromWizard(
    orgId: number,
    productData: SimpleProductData
  ): Promise<{ success: boolean; productId?: number; error?: string }> {
    try {
      // Start transaction to ensure all-or-nothing creation
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create or find supplier
        const supplier = await this.findOrCreateSupplier(tx, orgId, productData.supplier);
        
        // 2. Create product
        const product = await tx.products.create({
          data: {
            org_id: orgId,
            name: productData.name,
            type: productData.type,
            status: "active"
          }
        });

        // 3. Create product variant
        const variant = await tx.product_variants.create({
          data: {
            org_id: orgId,
            product_id: product.id,
            name: `${productData.name} - Standard`,
            subtype: this.getSubtypeForProductType(productData.type),
            attributes: this.buildVariantAttributes(productData),
            status: "active"
          }
        });

        // 4. Create contract (auto-generated)
        const contract = await tx.contracts.create({
          data: {
            org_id: orgId,
            supplier_id: supplier.id,
            reference: this.generateContractReference(orgId, supplier.id),
            status: "active"
          }
        });

        // 5. Create contract version
        const contractVersion = await tx.contract_versions.create({
          data: {
            org_id: orgId,
            contract_id: contract.id,
            valid_from: new Date(),
            valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            cancellation_policy: productData.settings.cancellationPolicy || this.getDefaultCancellationPolicy(),
            payment_policy: this.getDefaultPaymentPolicy(),
            terms: this.getDefaultTerms()
          }
        });

        // 6. Create rate plan
        const ratePlan = await tx.rate_plans.create({
          data: {
            org_id: orgId,
            product_variant_id: variant.id,
            supplier_id: supplier.id,
            contract_version_id: contractVersion.id,
            inventory_model: this.mapInventoryModel(productData.availability.type),
            currency: productData.settings.currency,
            markets: productData.settings.markets,
            channels: productData.settings.channels,
            preferred: true,
            valid_from: new Date(),
            valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            rate_doc: this.buildRateDoc(productData)
          }
        });

        // 7. Create rate seasons (if fixed availability with date range)
        if (productData.availability.type === 'fixed' && productData.availability.startDate && productData.availability.endDate) {
          await tx.rate_seasons.create({
            data: {
              org_id: orgId,
              rate_plan_id: ratePlan.id,
              season_from: productData.availability.startDate,
              season_to: productData.availability.endDate,
              dow_mask: 127, // All days of week
              min_pax: 1,
              max_pax: 10 // Reasonable default
            }
          });
        }

        // 8. Create occupancy pricing
        await this.createOccupancyPricing(tx, orgId, ratePlan.id, productData);

        // 9. Create inventory allocation
        await this.createInventoryAllocation(tx, orgId, variant.id, supplier.id, productData);

        // 10. Add default taxes if needed
        await this.addDefaultTaxes(tx, orgId, ratePlan.id, productData.type);

        return { product, variant, ratePlan };
      });

      return { success: true, productId: result.product.id };

    } catch (error) {
      console.error('Error creating product:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Find existing supplier or create new one
   */
  private static async findOrCreateSupplier(tx: any, orgId: number, supplierData: any) {
    if (supplierData.id && supplierData.id !== "new") {
      return await tx.suppliers.findUnique({
        where: { id: parseInt(supplierData.id) }
      });
    }

    return await tx.suppliers.create({
      data: {
        org_id: orgId,
        name: supplierData.name,
        terms: {},
        channels: ["direct", "agent"],
        status: "active"
      }
    });
  }

  /**
   * Get appropriate subtype for product type
   */
  private static getSubtypeForProductType(type: string): string {
    switch (type) {
      case 'hotel':
      case 'accommodation':
        return 'room_category';
      case 'activity':
        return 'time_slot';
      case 'transfer':
        return 'seat_tier';
      default:
        return 'none';
    }
  }

  /**
   * Build variant attributes from product data
   */
  private static buildVariantAttributes(productData: SimpleProductData) {
    const baseAttributes = {
      capacity: productData.availability.type === 'fixed' ? productData.availability.quantity : null,
      availability_type: productData.availability.type
    };

    // Add type-specific attributes
    switch (productData.type) {
      case 'hotel':
      case 'accommodation':
        return {
          ...baseAttributes,
          room_types: ['double', 'twin'], // Default room types for shared pool
          bedding_options: ['king', '2x single', 'queen']
        };
      case 'activity':
        return {
          ...baseAttributes,
          duration_hours: 8, // Default full-day activity
          group_size_min: 1,
          group_size_max: 20
        };
      case 'transfer':
        return {
          ...baseAttributes,
          vehicle_capacity: 8,
          vehicle_type: 'private'
        };
      default:
        return baseAttributes;
    }
  }

  /**
   * Generate contract reference
   */
  private static generateContractReference(orgId: number, supplierId: number): string {
    const timestamp = Date.now().toString().slice(-6);
    return `CTR-${orgId}-${supplierId}-${timestamp}`;
  }

  /**
   * Map simple availability type to inventory model
   */
  private static mapInventoryModel(availabilityType: string): string {
    switch (availabilityType) {
      case 'unlimited':
        return 'freesale';
      case 'fixed':
        return 'committed';
      case 'on-request':
        return 'on_request';
      default:
        return 'committed';
    }
  }

  /**
   * Generate date range array
   */
  private static generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  /**
   * Build rate document (JSONB field for complex pricing)
   */
  private static buildRateDoc(productData: SimpleProductData) {
    return {
      base_rates: {
        cost_per_person: productData.costPerPerson,
        price_per_person: productData.pricePerPerson,
        currency: productData.settings.currency
      },
      pricing_model: productData.settings.pricingModel,
      created_from_wizard: true,
      template_used: productData.type
    };
  }

  /**
   * Create occupancy pricing based on product type
   */
  private static async createOccupancyPricing(
    tx: any, 
    orgId: number, 
    ratePlanId: number, 
    productData: SimpleProductData
  ) {
    const pricingModel = productData.settings.pricingModel;

    if (pricingModel === 'per_person') {
      // Simple per-person pricing
      await tx.rate_occupancies.create({
        data: {
          org_id: orgId,
          rate_plan_id: ratePlanId,
          min_occupancy: 1,
          max_occupancy: 10,
          pricing_model: 'per_person',
          base_amount: productData.pricePerPerson,
          per_person_amount: null
        }
      });
    } else {
      // More complex occupancy-based pricing (for hotels)
      await tx.rate_occupancies.createMany({
        data: [
          {
            org_id: orgId,
            rate_plan_id: ratePlanId,
            min_occupancy: 1,
            max_occupancy: 1,
            pricing_model: 'fixed',
            base_amount: productData.pricePerPerson * 0.8, // Single occupancy discount
            per_person_amount: null
          },
          {
            org_id: orgId,
            rate_plan_id: ratePlanId,
            min_occupancy: 2,
            max_occupancy: 4,
            pricing_model: 'base_plus_pax',
            base_amount: productData.pricePerPerson,
            per_person_amount: productData.pricePerPerson * 0.2 // Additional person rate
          }
        ]
      });
    }
  }

  /**
   * Create inventory allocation buckets
   */
  private static async createInventoryAllocation(
    tx: any,
    orgId: number,
    variantId: number,
    supplierId: number,
    productData: SimpleProductData
  ) {
    if (productData.availability.type === 'unlimited') {
      // Create single unlimited bucket
      await tx.allocation_buckets.create({
        data: {
          org_id: orgId,
          product_variant_id: variantId,
          supplier_id: supplierId,
          date: new Date(),
          allocation_type: 'freesale',
          quantity: null, // Unlimited
          booked: 0,
          held: 0
        }
      });
    } else if (productData.availability.type === 'fixed' && 
               productData.availability.startDate && 
               productData.availability.endDate) {
      // Create daily buckets for the date range
      const startDate = new Date(productData.availability.startDate);
      const endDate = new Date(productData.availability.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const buckets = [];
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        buckets.push({
          org_id: orgId,
          product_variant_id: variantId,
          supplier_id: supplierId,
          date: date,
          allocation_type: 'committed',
          quantity: productData.availability.quantity || 100,
          booked: 0,
          held: 0
        });
      }

      await tx.allocation_buckets.createMany({
        data: buckets
      });
    }
    // For 'on-request', we don't create allocation buckets upfront
  }

  /**
   * Add default taxes based on product type
   */
  private static async addDefaultTaxes(
    tx: any,
    orgId: number,
    ratePlanId: number,
    productType: string
  ) {
    if (productType === 'hotel' || productType === 'accommodation') {
      // Add city tax for hotels
      await tx.rate_taxes_fees.create({
        data: {
          org_id: orgId,
          rate_plan_id: ratePlanId,
          name: 'City Tax',
          jurisdiction: null,
          inclusive: false,
          calc_base: 'per_person_per_night',
          amount_type: 'fixed',
          value: 5, // £5 per person per night
          rounding_rule: 'round_up'
        }
      });
    }
  }

  /**
   * Get default cancellation policy
   */
  private static getDefaultCancellationPolicy() {
    return {
      notice_period: {
        days: 30,
        type: "calendar"
      },
      penalties: {
        early_termination: {
          percentage: 10,
          minimum_amount: 50,
          currency: "GBP"
        }
      },
      exceptions: {
        force_majeure: true,
        medical_emergency: true
      }
    };
  }

  /**
   * Get default payment policy
   */
  private static getDefaultPaymentPolicy() {
    return {
      payment_terms: {
        type: "net",
        days: 30
      },
      currency: "GBP",
      payment_methods: ["bank_transfer", "credit_card"],
      late_fees: {
        enabled: true,
        percentage: 2,
        grace_period_days: 5
      }
    };
  }

  /**
   * Get default terms
   */
  private static getDefaultTerms() {
    return {
      liability: {
        provider_liability: {
          maximum_amount: 100000,
          currency: "GBP",
          coverage_types: ["property_damage", "personal_injury"]
        }
      },
      jurisdiction: {
        governing_law: "United Kingdom",
        dispute_resolution: "arbitration"
      }
    };
  }

  /**
   * Get product templates for wizard
   */
  static async getProductTemplates(): Promise<ProductTemplate[]> {
    return await prisma.product_templates.findMany({
      where: { is_default: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Create shared inventory pool for multiple room types
   */
  static async createSharedInventoryPool(
    orgId: number,
    supplierId: number,
    name: string,
    quantity: number,
    startDate: Date,
    endDate: Date
  ): Promise<InventoryPool> {
    return await prisma.$transaction(async (tx) => {
      // Create inventory pool
      const pool = await tx.inventory_pools.create({
        data: {
          org_id: orgId,
          supplier_id: supplierId,
          name: name,
          pool_type: 'shared'
        }
      });

      // Create allocation buckets for the pool
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const buckets = [];

      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        buckets.push({
          org_id: orgId,
          product_variant_id: 0, // Will be updated when variants are linked
          supplier_id: supplierId,
          date: date,
          allocation_type: 'committed',
          quantity: quantity,
          booked: 0,
          held: 0,
          inventory_pool_id: pool.id
        });
      }

      await tx.allocation_buckets.createMany({
        data: buckets
      });

      return pool;
    });
  }

  /**
   * Calculate occupancy price using the enhanced pricing model
   */
  static async calculateOccupancyPrice(
    ratePlanId: number,
    paxCount: number
  ): Promise<number> {
    const occupancy = await prisma.rate_occupancies.findFirst({
      where: {
        rate_plan_id: ratePlanId,
        min_occupancy: { lte: paxCount },
        max_occupancy: { gte: paxCount }
      },
      orderBy: { min_occupancy: 'desc' }
    });

    if (!occupancy) {
      throw new Error(`No occupancy rate found for ${paxCount} people in rate plan ${ratePlanId}`);
    }

    switch (occupancy.pricing_model) {
      case 'fixed':
        return Number(occupancy.base_amount);
      
      case 'base_plus_pax':
        const additionalPax = Math.max(0, paxCount - occupancy.min_occupancy);
        return Number(occupancy.base_amount) + (additionalPax * Number(occupancy.per_person_amount || 0));
      
      case 'per_person':
        return paxCount * Number(occupancy.base_amount);
      
      default:
        throw new Error(`Unknown pricing model: ${occupancy.pricing_model}`);
    }
  }
}

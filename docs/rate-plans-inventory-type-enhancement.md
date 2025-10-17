# Rate Plans by Inventory Type Enhancement Plan

## Overview
Enhance the rate plan system to be inventory-type aware, providing context-specific pricing strategies and smarter revenue optimization.

## Current System Analysis
- Rate plans are generic per product variant
- No connection between inventory type and pricing structure
- Missing context-aware pricing strategies
- One-size-fits-all approach doesn't optimize for different business models

## Proposed Enhancement: Inventory-Type Aware Rate Plans

### 1. Database Schema Changes

#### Add to rate_plans table:
```sql
ALTER TABLE rate_plans ADD COLUMN inventory_type TEXT;
ALTER TABLE rate_plans ADD COLUMN pricing_structure JSONB;
ALTER TABLE rate_plans ADD COLUMN template_id BIGINT REFERENCES rate_plan_templates(id);
```

#### Create rate_plan_templates table:
```sql
CREATE TABLE rate_plan_templates (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  inventory_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Rate Plan Templates by Inventory Type

#### Accommodation (Committed Inventory)
**Pricing Structure:**
- Base rate per room type
- Seasonal multipliers (high/low season)
- Occupancy supplements (single/double/triple)
- Length of stay discounts
- Advance booking discounts
- Stop-sell pricing controls

**Template Example:**
```json
{
  "base_rate": 150,
  "seasonal_multipliers": {
    "high_season": 1.5,
    "low_season": 0.8,
    "shoulder_season": 1.0
  },
  "occupancy_supplements": {
    "single": 0,
    "double": 25,
    "triple": 50,
    "quad": 75
  },
  "length_of_stay_discounts": {
    "3_nights": 0.05,
    "7_nights": 0.10,
    "14_nights": 0.15
  },
  "advance_booking_discounts": {
    "30_days": 0.05,
    "60_days": 0.10,
    "90_days": 0.15
  }
}
```

#### Events (Committed Inventory)
**Pricing Structure:**
- Tier-based pricing (VIP/Standard/Economy)
- Early bird discounts
- Group size discounts
- Dynamic pricing based on demand
- Category-specific pricing

**Template Example:**
```json
{
  "tier_pricing": {
    "vip": 500,
    "standard": 200,
    "economy": 100
  },
  "early_bird_discounts": {
    "30_days": 0.10,
    "60_days": 0.15,
    "90_days": 0.20
  },
  "group_discounts": {
    "10_plus": 0.05,
    "25_plus": 0.10,
    "50_plus": 0.15
  },
  "demand_pricing": {
    "high_demand_multiplier": 1.2,
    "low_demand_multiplier": 0.8
  }
}
```

#### Transfers (Freesale Inventory)
**Pricing Structure:**
- Distance-based pricing
- Vehicle type multipliers
- Group size discounts
- Time-of-day pricing
- Route-specific pricing

**Template Example:**
```json
{
  "base_rate_per_km": 2.50,
  "vehicle_multipliers": {
    "sedan": 1.0,
    "van": 1.3,
    "bus": 1.8,
    "luxury": 2.0
  },
  "group_discounts": {
    "4_plus": 0.10,
    "8_plus": 0.15,
    "12_plus": 0.20
  },
  "time_pricing": {
    "peak_hours": 1.2,
    "off_peak": 0.9,
    "night_time": 1.3
  }
}
```

#### Activities (On-Request Inventory)
**Pricing Structure:**
- Guide-dependent pricing
- Equipment fee structures
- Group size minimums
- Weather-dependent pricing
- Confirmation-required pricing

**Template Example:**
```json
{
  "base_rate_per_person": 75,
  "guide_fees": {
    "basic_guide": 50,
    "expert_guide": 100,
    "specialist_guide": 150
  },
  "equipment_fees": {
    "basic": 0,
    "premium": 25,
    "professional": 50
  },
  "group_minimums": {
    "minimum_participants": 4,
    "minimum_fee": 300
  },
  "weather_pricing": {
    "indoor_alternative": 0.8,
    "weather_cancellation": 0.0
  }
}
```

### 3. Implementation Strategy

#### Phase 1: Database Enhancement
- [ ] Add inventory_type to rate_plans table
- [ ] Create rate_plan_templates table
- [ ] Add pricing_structure JSONB field
- [ ] Create migration scripts
- [ ] Seed default templates

#### Phase 2: Rate Plan Wizard Enhancement
- [ ] Add inventory type selection step
- [ ] Create template-based rate plan creation
- [ ] Add inventory-type specific fields
- [ ] Implement smart defaults
- [ ] Add template preview

#### Phase 3: Pricing Engine
- [ ] Create pricing calculation service
- [ ] Implement inventory-aware pricing
- [ ] Add dynamic pricing rules
- [ ] Create pricing validation
- [ ] Add pricing preview

#### Phase 4: UI/UX Improvements
- [ ] Context-aware rate plan forms
- [ ] Template selection interface
- [ ] Pricing preview components
- [ ] Inventory type indicators
- [ ] Smart field suggestions

### 4. Technical Implementation

#### Database Schema:
```sql
-- Add inventory type to rate plans
ALTER TABLE rate_plans ADD COLUMN inventory_type TEXT;
ALTER TABLE rate_plans ADD COLUMN pricing_structure JSONB;
ALTER TABLE rate_plans ADD COLUMN template_id BIGINT REFERENCES rate_plan_templates(id);

-- Create templates table
CREATE TABLE rate_plan_templates (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  inventory_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rate_plans_inventory_type ON rate_plans(inventory_type);
CREATE INDEX idx_rate_plan_templates_type ON rate_plan_templates(inventory_type);
```

#### Component Structure:
```
components/
├── rate-plans/
│   ├── RatePlanWizard.tsx
│   ├── InventoryTypeSelector.tsx
│   ├── TemplateSelector.tsx
│   ├── PricingStructureBuilder.tsx
│   └── RatePlanCalculator.tsx
├── templates/
│   ├── AccommodationTemplate.tsx
│   ├── EventTemplate.tsx
│   ├── TransferTemplate.tsx
│   └── ActivityTemplate.tsx
└── pricing/
    ├── PricingEngine.tsx
    ├── DynamicPricing.tsx
    └── PricingPreview.tsx
```

#### Service Layer:
```typescript
// services/pricing-engine.ts
export class PricingEngine {
  calculateRate(ratePlan: RatePlan, context: PricingContext): number
  applySeasonalMultipliers(baseRate: number, season: string): number
  applyOccupancySupplements(rate: number, occupancy: number): number
  applyGroupDiscounts(rate: number, groupSize: number): number
  applyEarlyBirdDiscounts(rate: number, daysAdvance: number): number
}

// services/rate-plan-templates.ts
export class RatePlanTemplateService {
  getTemplatesByInventoryType(type: string): RatePlanTemplate[]
  createTemplate(template: RatePlanTemplate): RatePlanTemplate
  updateTemplate(id: number, template: RatePlanTemplate): RatePlanTemplate
  deleteTemplate(id: number): boolean
}
```

### 5. Key Benefits

#### Revenue Optimization
- **Smart Pricing**: Context-aware pricing strategies
- **Demand-Based**: Dynamic pricing based on inventory availability
- **Seasonal Optimization**: Automatic seasonal adjustments
- **Group Discounts**: Intelligent group pricing

#### User Experience
- **Context-Aware**: Relevant fields based on inventory type
- **Template System**: Pre-built pricing structures
- **Smart Defaults**: Intelligent default values
- **Preview System**: Real-time pricing preview

#### Business Intelligence
- **Pricing Analytics**: Revenue optimization insights
- **Demand Patterns**: Inventory utilization analysis
- **Competitive Pricing**: Market-based pricing suggestions
- **ROI Tracking**: Return on investment metrics

### 6. Future Considerations

#### Advanced Features
- **Machine Learning**: AI-powered dynamic pricing
- **External APIs**: Integration with pricing services
- **A/B Testing**: Pricing strategy experimentation
- **Revenue Analytics**: Advanced reporting and insights
- **Automated Adjustments**: Self-optimizing pricing

#### Integration Points
- **Booking Engine**: Real-time pricing integration
- **Revenue Management**: Advanced revenue optimization
- **Market Data**: External market pricing feeds
- **Competitor Analysis**: Competitive pricing intelligence

### 7. Migration Strategy

#### Data Migration
1. **Existing Rate Plans**: Add inventory_type based on product type
2. **Template Creation**: Create default templates for each inventory type
3. **Pricing Structure**: Migrate existing pricing to new structure
4. **Validation**: Ensure data integrity and consistency

#### Rollout Plan
1. **Beta Testing**: Limited rollout to select users
2. **Template Library**: Build comprehensive template library
3. **User Training**: Training materials and documentation
4. **Full Rollout**: Gradual rollout to all users
5. **Monitoring**: Performance monitoring and optimization

### 8. Success Metrics

#### Technical Metrics
- **Performance**: Pricing calculation speed
- **Accuracy**: Pricing calculation accuracy
- **Reliability**: System uptime and error rates
- **Scalability**: System performance under load

#### Business Metrics
- **Revenue Impact**: Revenue increase from optimized pricing
- **User Adoption**: Template usage and user engagement
- **Efficiency**: Time saved in rate plan creation
- **Satisfaction**: User satisfaction scores

### 9. Risk Mitigation

#### Technical Risks
- **Data Migration**: Comprehensive testing and rollback plans
- **Performance**: Load testing and optimization
- **Compatibility**: Backward compatibility with existing systems
- **Security**: Data protection and access controls

#### Business Risks
- **User Adoption**: Training and support programs
- **Revenue Impact**: Gradual rollout and monitoring
- **Complexity**: Simplified user interface and workflows
- **Change Management**: Clear communication and documentation

---

**Status**: Planning Phase
**Priority**: Medium
**Estimated Effort**: 3-4 sprints
**Dependencies**: Database schema updates, template library creation

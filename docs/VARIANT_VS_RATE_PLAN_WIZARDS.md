# Variant vs Rate Plan Wizards

## 🎯 **Current: CREATE VARIANT Wizard**

**Purpose:** Create a new product variant with its first rate plan

**What it creates:**
- ✅ New product variant (if new product) OR new variant for existing product
- ✅ First rate plan for that variant
- ✅ Basic allocation/availability setup
- ✅ Supplier and contract creation
- ✅ Custom attributes for the variant

**Flow:**
```
1. Product Type (if new) / Variant Details
2. Variant Details / Rate Plan Template  
3. Rate Plan Template / Pricing & Details
4. Pricing & Details / Availability
5. Availability → CREATE VARIANT
```

**Use Cases:**
- Creating a new hotel with "Standard Room" variant
- Adding "Deluxe Room" variant to existing hotel
- Creating new tour with "Morning Tour" variant
- Adding "VIP Package" variant to existing event

---

## 🎯 **Future: CREATE RATE PLAN Wizard**

**Purpose:** Add additional rate plans to existing variants

**What it creates:**
- ✅ Additional rate plan for existing variant
- ✅ Different supplier/contract options
- ✅ Seasonal pricing variations
- ✅ Different channel configurations
- ✅ Advanced occupancy rules

**Flow:**
```
1. Select Existing Variant
2. Rate Plan Details (name, supplier, contract)
3. Pricing Configuration
4. Advanced Settings (seasons, occupancy, taxes)
5. Availability → CREATE RATE PLAN
```

**Use Cases:**
- Adding "Summer Rate" to existing hotel room variant
- Adding "Agent Rate" to existing tour variant
- Adding "Group Rate" to existing event variant
- Adding "Last Minute Rate" to existing variant

---

## 📊 **Comparison**

| Feature | CREATE VARIANT | CREATE RATE PLAN |
|---------|---------------|------------------|
| **Creates** | New variant + first rate plan | Additional rate plan for existing variant |
| **Complexity** | Medium (4-5 steps) | High (5-6 steps with advanced options) |
| **Templates** | ✅ Smart product type templates | ❌ No templates (variant already exists) |
| **Custom Attributes** | ✅ Variant-level attributes | ❌ Rate plan only |
| **Supplier Selection** | ✅ Create new or select existing | ✅ Select existing only |
| **Contract Creation** | ✅ Create new contracts | ✅ Create new contracts |
| **Advanced Pricing** | ✅ Basic markup, taxes/fees | ✅ Full seasonal, occupancy, adjustments |
| **Availability** | ✅ Basic allocation setup | ✅ Advanced allocation rules |

---

## 🔄 **Typical Workflow**

### Scenario: Hotel with Multiple Room Types and Rates

1. **CREATE VARIANT:** "Standard Room"
   - First rate plan: "Standard Rate" (£100/night, Direct supplier)
   - Basic availability setup

2. **CREATE RATE PLAN:** Add "Summer Rate" to Standard Room
   - Additional rate plan: "Summer Rate" (£120/night, same supplier)
   - Seasonal validity: June-August

3. **CREATE RATE PLAN:** Add "Agent Rate" to Standard Room  
   - Additional rate plan: "Agent Rate" (£90/night, different supplier)
   - Channel: B2B only

4. **CREATE VARIANT:** "Deluxe Room"
   - First rate plan: "Deluxe Rate" (£150/night, Direct supplier)
   - Different room attributes

---

## 🎨 **UI/UX Considerations**

### CREATE VARIANT Wizard (Current)
- **Progressive disclosure:** Advanced features hidden by default
- **Templates:** Smart defaults based on product type
- **Guided flow:** Step-by-step with clear descriptions
- **Context-aware:** Different flows for new vs existing products

### CREATE RATE PLAN Wizard (Future)
- **Advanced features:** All options visible upfront
- **Copy existing:** Ability to clone existing rate plans
- **Bulk operations:** Create multiple rate plans at once
- **Validation:** Complex business rules (e.g., seasonal overlaps)

---

## 🚀 **Implementation Priority**

### Phase 1: ✅ COMPLETE
- [x] CREATE VARIANT wizard
- [x] Smart templates
- [x] Custom attributes
- [x] Basic rate plan creation
- [x] Database integration

### Phase 2: 🔄 PLANNED
- [ ] CREATE RATE PLAN wizard
- [ ] Advanced pricing options
- [ ] Seasonal management
- [ ] Bulk rate plan creation
- [ ] Rate plan cloning

### Phase 3: 🔮 FUTURE
- [ ] Rate plan templates
- [ ] Automated rate adjustments
- [ ] Competitive pricing tools
- [ ] Revenue management features

---

## 💡 **Key Insights**

1. **Different User Intent:** Variant creation is about product structure, rate plan creation is about pricing strategy

2. **Complexity Levels:** Variant creation should be simple and guided, rate plan creation can be more complex and feature-rich

3. **Reusability:** Rate plan creation can reuse many components from variant creation, but with different defaults and validation

4. **Business Logic:** Rate plans have more complex business rules (seasonal overlaps, occupancy conflicts, channel restrictions)

5. **User Journey:** Most users will create variants first, then add multiple rate plans over time as their business grows

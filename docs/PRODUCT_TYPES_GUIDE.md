# 🎯 Complete Product Types Guide - MVP

Complete breakdown of all 6 product types with attributes, options, and rate structures.

---

## 1. 🏨 ACCOMMODATION

### **Overview**
Hotels, apartments, villas, and lodging. Complex pricing with occupancy variations, contracted allocations, and inventory management.

### **Product Attributes** (products.attributes JSONB)
```json
{
  "property_type": "hotel",
  "star_rating": 4,
  "location_type": "city_center",
  "check_in_time": "15:00",
  "check_out_time": "11:00",
  "amenities": ["wifi", "pool", "gym", "spa"],
  "minimum_stay": 3,
  "maximum_stay": 14
}
```

### **Product Option Attributes** (product_options.attributes JSONB)
```json
{
  "room_type": "standard",
  "bed_configuration": "king",
  "view_type": "city",
  "room_size_sqm": 35,
  "max_occupancy": 3,
  "standard_occupancy": 2,
  "extra_bed_available": true
}
```

### **Supplier Rate (supplier_rates)**
- `rate_basis`: "per_night"
- `base_cost`: Cost per night
- `pricing_details`: Occupancy pricing, seasonal rates, add-ons

### **Selling Rate (selling_rates)**
- `rate_basis`: "per_night"
- `base_price`: Customer price per night
- `pricing_details`: Customer pricing, add-ons, policies

---

## 2. 🎫 EVENT TICKETS

### **Overview**
Race tickets, grandstand seats, paddock passes. Simple per-unit pricing with batch inventory allocations.

### **Product Attributes** (products.attributes JSONB)
```json
{
  "ticket_category": "grandstand",
  "venue_section": "Grandstand K",
  "access_type": "full_weekend",
  "includes": ["Access to grandstand", "Race program"]
}
```

### **Product Option Attributes** (product_options.attributes JSONB)
```json
{
  "ticket_type": "3_day_pass",
  "age_category": "adult",
  "days_included": ["2025-05-23", "2025-05-24", "2025-05-25"]
}
```

### **Supplier Rate (supplier_rates)**
- `rate_basis`: "per_unit"
- `base_cost`: Cost per ticket
- `pricing_details`: Age-based pricing, volume discounts

### **Selling Rate (selling_rates)**
- `rate_basis`: "per_unit"
- `base_price`: Price per ticket
- `pricing_details`: Age pricing, package deals

---

## 3. 🚗 TRANSFERS

### **Overview**
Airport transfers, circuit shuttles, ground transport. On-request products with no inventory, priced per vehicle.

### **Product Attributes** (products.attributes JSONB)
```json
{
  "transfer_type": "airport",
  "service_level": "private",
  "route": {
    "from": "Nice Airport (NCE)",
    "to": "Monaco (any address)"
  },
  "distance": {"value": 30, "unit": "km"}
}
```

### **Product Option Attributes** (product_options.attributes JSONB)
```json
{
  "vehicle_type": "standard_car",
  "capacity": {
    "passengers": 3,
    "luggage_large": 2
  },
  "pricing_basis": "per_vehicle"
}
```

### **Supplier Rate (supplier_rates)**
- `rate_basis`: "per_booking"
- `base_cost`: Cost per transfer
- `pricing_details`: Vehicle rates, time surcharges, add-ons

### **Selling Rate (selling_rates)**
- `rate_basis`: "per_booking"
- `base_price`: Customer price
- `pricing_details`: Vehicle pricing, time surcharges, extras

---

## 4. ✈️ TRANSPORT (Flights/Trains)

### **Overview**
Flights, trains, ferries. Dynamic products with generic catalog entries and specific details in transport_segments.

### **Product Attributes** (products.attributes JSONB)
```json
{
  "transport_mode": "flight",
  "route_type": "international",
  "origin_region": "UK",
  "destination_region": "France",
  "typical_routes": ["London → Nice"]
}
```

### **Product Option Attributes** (product_options.attributes JSONB)
```json
{
  "service_class": "economy",
  "ticket_flexibility": "flexible"
}
```

### **Supplier Rate (supplier_rates)**
- `rate_basis`: "per_person"
- `base_cost`: Dynamic quote from broker
- `pricing_details`: Flight details, baggage, quote metadata

### **Selling Rate (selling_rates)**
- `rate_basis`: "per_person"
- `base_price`: Customer price
- `pricing_details`: Flight summary, add-ons, quote validity

---

## 5. ✨ EXPERIENCES

### **Overview**
Tours, activities, yacht charters, helicopter rides. On-request products, typically priced per booking or per person.

### **Product Attributes** (products.attributes JSONB)
```json
{
  "experience_type": "tour",
  "category": "water_activity",
  "duration": {"value": 2, "unit": "hours"},
  "group_type": "private",
  "capacity": {"min_participants": 2, "max_participants": 8}
}
```

### **Product Option Attributes** (product_options.attributes JSONB)
```json
{
  "option_type": "duration",
  "duration_hours": 2,
  "yacht_type": "Sunseeker 60ft",
  "capacity_details": {"max_guests": 8, "crew": 2}
}
```

### **Supplier Rate (supplier_rates)**
- `rate_basis`: "per_booking" or "per_person"
- `base_cost`: Cost per booking
- `pricing_details`: Duration rates, group pricing, add-ons

### **Selling Rate (selling_rates)**
- `rate_basis`: "per_booking" or "per_person"
- `base_price`: Customer price
- `pricing_details`: Duration pricing, add-ons, highlights

---

## 6. ➕ EXTRAS

### **Overview**
Supplementary items like lounge access, insurance, parking. Simple products, typically high margins.

### **Product Attributes** (products.attributes JSONB)
```json
{
  "extra_type": "airport_service",
  "category": "travel_convenience",
  "location": {"venue": "Nice Airport"},
  "facilities": ["Food buffet", "Premium drinks", "WiFi"]
}
```

### **Product Option Attributes** (product_options.attributes JSONB)
```json
{
  "access_type": "departure",
  "visit_count": "single",
  "includes": ["3 hour lounge access", "Unlimited food & drinks"]
}
```

### **Supplier Rate (supplier_rates)**
- `rate_basis`: "per_person" or "per_unit"
- `base_cost`: Cost per person
- `pricing_details`: Simple per-person pricing, access options

### **Selling Rate (selling_rates)**
- `rate_basis`: "per_person" or "per_unit"
- `base_price`: Customer price
- `pricing_details`: Simple pricing, access options, benefits

---

## 📊 Summary Table

| Type | Inventory | Rate Basis | Pricing Complexity | Margin |
|------|-----------|------------|-------------------|--------|
| **Accommodation** | ✅ Yes | per_night | High | 15-25% |
| **Event Tickets** | ✅ Yes | per_unit | Medium | 20-30% |
| **Transfers** | ❌ No | per_booking | Low | 25-40% |
| **Transport** | ❌ No | per_person | High | 5-15% |
| **Experiences** | ❌ No | per_booking | Medium | 30-50% |
| **Extras** | ❌ No | varies | Low | 30-70% |

---

## 🎯 Rate Basis Values

```typescript
rate_basis:
  | "per_night"        // Accommodation
  | "per_unit"         // Event tickets, merchandise
  | "per_person"       // Transport, experiences, extras
  | "per_booking"      // Transfers, experiences
  | "per_vehicle"      // Alternative for transfers
  | "per_hour"         // Hourly services
  | "per_day"          // Daily services
```

---

## ✅ Key Implementation Points

1. **Products Table**: Use `attributes` JSONB for product-specific data
2. **Product Options Table**: Use `attributes` JSONB for option-specific data
3. **Supplier Rates**: Use `pricing_details` JSONB for complex pricing
4. **Selling Rates**: Use `pricing_details` JSONB for customer pricing
5. **NO PRICING IN PRODUCT_OPTIONS**: All pricing is in rates tables

This comprehensive structure supports all 6 product types with their unique requirements! 🚀

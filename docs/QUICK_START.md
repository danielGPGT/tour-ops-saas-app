# 🚀 Quick Start Guide - F1 Grand Prix System

## 🎯 **Step 1: Environment Setup**

### **Option A: Use Existing Database (Recommended)**
If you already have a database set up, skip to Step 2.

### **Option B: Set Up New Database**
1. **Create `.env.local` file** in project root:
```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tour_ops"

# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

2. **Run database setup**:
```bash
node scripts/setup-database.js
```

3. **Test connection**:
```bash
node scripts/test-db-connection.js
```

## 🎯 **Step 2: Seed F1 Scenario Data**

Run our F1 Grand Prix seed script:
```bash
# This will populate the database with:
# - Fairmont Palm Dubai supplier
# - F1 ticket suppliers
# - Transfer suppliers
# - Complete rate plans and inventory
psql -d your_database -f scripts/seed-f1-scenario.sql
```

## 🎯 **Step 3: Start Development Server**

```bash
npm run dev
```

Visit: `http://localhost:3000`

## 🎯 **Step 4: Build UI Components**

We'll build these components in order:

### **Phase 1: Foundation (Week 1)**
1. **Supplier Management** - List, create, edit suppliers
2. **Contract Management** - Contract creation and versioning
3. **Rate Plan Builder** - Complex pricing logic
4. **Inventory Calendar** - Visual allocation management

### **Phase 2: Advanced Features (Week 2)**
1. **Package Builder** - F1 Grand Prix packages
2. **Booking System** - End-to-end booking flow
3. **Analytics Dashboard** - Performance metrics
4. **Reporting System** - Revenue and utilization reports

## 🎯 **Step 5: Test F1 Scenario**

Once the UI is built, test the complete F1 Grand Prix scenario:

1. **Create Fairmont Palm Dubai supplier**
2. **Set up hotel contract with 100 rooms**
3. **Configure rate plans with seasonal pricing**
4. **Set up F1 ticket allocation**
5. **Configure transfer services**
6. **Create F1 Grand Prix package**
7. **Test booking scenarios**

## 🎯 **What We're Building**

### **Supplier Management**
- List all suppliers
- Create new suppliers
- Edit supplier details
- View supplier performance

### **Contract Management**
- Create contracts with suppliers
- Version control for contract changes
- Terms and conditions management
- Payment and cancellation policies

### **Rate Plan Builder**
- Complex pricing logic
- Seasonal adjustments
- Occupancy-based pricing
- Age band pricing
- Tax and fee calculations

### **Inventory Management**
- Calendar view of allocations
- Bulk operations
- Overbooking controls
- Hold management
- Real-time availability

### **Package Management**
- Create F1 Grand Prix packages
- Component management
- Pricing aggregation
- Availability checking

## 🎯 **Next Steps**

1. **Set up environment** (if not already done)
2. **Run F1 seed script** to populate database
3. **Start building UI components** starting with suppliers
4. **Test each component** as we build it
5. **Integrate components** into complete system

## 🎯 **Success Criteria**

- ✅ Complete F1 Grand Prix scenario setup
- ✅ All pricing rules working correctly
- ✅ Inventory allocation accurate
- ✅ Booking flow functional
- ✅ Package management working
- ✅ Analytics and reporting

## 🚀 **Ready to Start?**

Let's begin with the database setup and then move to building the UI components!

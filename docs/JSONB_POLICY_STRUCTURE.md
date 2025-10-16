# JSONB Policy Structure Documentation

## Overview

This document outlines the structured JSONB format used for contract version policies. Instead of free-form JSON, we use a well-defined schema that provides:

- **Type Safety**: Structured data with validation
- **User-Friendly Forms**: Intuitive form interfaces
- **Rich Display**: Human-readable policy presentation
- **Queryability**: Easy database queries and filtering

## Policy Types

### 1. Cancellation Policy (`cancellation_policy`)

```json
{
  "notice_period": {
    "days": 30,
    "type": "calendar"  // "calendar" | "business"
  },
  "penalties": {
    "early_termination": {
      "percentage": 10,
      "minimum_amount": 100,
      "currency": "USD"
    },
    "no_show": {
      "percentage": 100,
      "minimum_amount": 50,
      "currency": "USD"
    }
  },
  "exceptions": {
    "force_majeure": true,
    "medical_emergency": true,
    "government_restrictions": true
  },
  "refund_policy": {
    "partial_refunds": true,
    "refund_percentage": 80,
    "processing_fee": 5
  }
}
```

### 2. Payment Policy (`payment_policy`)

```json
{
  "payment_terms": {
    "type": "net",        // "net" | "prepaid" | "deposit"
    "days": 30,           // for "net" type
    "percentage": 50      // for "deposit" type
  },
  "currency": "USD",
  "payment_methods": ["bank_transfer", "credit_card", "paypal"],
  "late_fees": {
    "enabled": true,
    "percentage": 2,
    "grace_period_days": 5
  },
  "invoicing": {
    "frequency": "per_booking",  // "per_booking" | "monthly" | "quarterly"
    "due_date_days": 30,
    "auto_invoice": true
  },
  "discounts": {
    "early_payment": {
      "percentage": 2,
      "days_before_due": 10
    },
    "volume": {
      "tiers": [
        {
          "min_bookings": 10,
          "discount_percentage": 5
        },
        {
          "min_bookings": 25,
          "discount_percentage": 10
        }
      ]
    }
  }
}
```

### 3. Terms & Conditions (`terms`)

```json
{
  "liability": {
    "provider_liability": {
      "maximum_amount": 100000,
      "currency": "USD",
      "coverage_types": ["property_damage", "personal_injury"]
    },
    "customer_liability": {
      "damages": true,
      "loss_of_property": true,
      "personal_injury": false
    },
    "insurance_requirements": {
      "provider_required": true,
      "customer_required": false,
      "minimum_coverage": 500000
    }
  },
  "jurisdiction": {
    "governing_law": "United States",
    "dispute_resolution": "arbitration",  // "mediation" | "arbitration" | "litigation"
    "venue": "New York, NY"
  },
  "force_majeure": {
    "included_events": ["natural_disasters", "pandemics", "government_restrictions"],
    "notification_period": 48,
    "remedies": ["reschedule", "partial_refund", "full_refund"]
  },
  "data_protection": {
    "gdpr_compliant": true,
    "data_retention_days": 365,
    "third_party_sharing": false
  }
}
```

## Benefits of This Structure

### 1. **User Experience**
- **Intuitive Forms**: Users fill out structured forms instead of writing JSON
- **Validation**: Built-in validation prevents invalid data
- **Visual Feedback**: Clear display of policy settings

### 2. **Database Queries**
```sql
-- Find contracts with specific cancellation terms
SELECT * FROM contract_versions 
WHERE cancellation_policy->'notice_period'->>'days' = '30';

-- Find contracts with early payment discounts
SELECT * FROM contract_versions 
WHERE payment_policy->'discounts'->'early_payment'->>'percentage' > '0';

-- Find contracts with GDPR compliance
SELECT * FROM contract_versions 
WHERE terms->'data_protection'->>'gdpr_compliant' = 'true';
```

### 3. **Business Logic**
```typescript
// Calculate cancellation penalty
function calculateCancellationPenalty(
  cancellationPolicy: CancellationPolicy,
  bookingAmount: number,
  daysFromBooking: number
): number {
  const noticePeriod = cancellationPolicy.notice_period.days;
  
  if (daysFromBooking >= noticePeriod) {
    return 0; // No penalty
  }
  
  const penalty = cancellationPolicy.penalties.early_termination;
  return Math.max(
    (bookingAmount * penalty.percentage) / 100,
    penalty.minimum_amount || 0
  );
}

// Check if force majeure applies
function isForceMajeureApplicable(
  terms: TermsAndConditions,
  event: string
): boolean {
  return terms.force_majeure?.included_events?.includes(event) || false;
}
```

## Form Interface

The `PolicyForm` component provides:

- **Tabbed Interface**: Separate tabs for each policy type
- **Conditional Fields**: Fields appear based on selections
- **Real-time Validation**: Immediate feedback on invalid inputs
- **Default Values**: Sensible defaults for common scenarios

## Display Interface

The `PolicyViewer` component provides:

- **Card-based Layout**: Clean, organized display
- **Badge System**: Visual indicators for key values
- **Tooltips**: Additional context on hover
- **Responsive Design**: Works on all screen sizes

## Migration Strategy

### From Free-form JSON
```typescript
// Old approach
const oldPolicy = {
  "cancellation": "30 days notice, 10% penalty",
  "payment": "Net 30, USD currency",
  "terms": "US law, arbitration"
};

// New structured approach
const newPolicy = {
  cancellation_policy: {
    notice_period: { days: 30, type: "calendar" },
    penalties: { early_termination: { percentage: 10, currency: "USD" } }
  },
  payment_policy: {
    payment_terms: { type: "net", days: 30 },
    currency: "USD"
  },
  terms: {
    jurisdiction: { governing_law: "United States", dispute_resolution: "arbitration" }
  }
};
```

## Best Practices

1. **Always validate** JSONB data before saving
2. **Use consistent** currency codes and date formats
3. **Provide defaults** for optional fields
4. **Version your schema** for future changes
5. **Index frequently queried** JSONB paths

## Example Use Cases

### Travel Agency Contract
```json
{
  "cancellation_policy": {
    "notice_period": { "days": 14, "type": "calendar" },
    "penalties": {
      "early_termination": { "percentage": 25, "currency": "USD" },
      "no_show": { "percentage": 100, "currency": "USD" }
    },
    "exceptions": { "force_majeure": true, "medical_emergency": true }
  },
  "payment_policy": {
    "payment_terms": { "type": "deposit", "percentage": 30 },
    "currency": "USD",
    "payment_methods": ["credit_card", "bank_transfer"]
  }
}
```

### Hotel Contract
```json
{
  "cancellation_policy": {
    "notice_period": { "days": 7, "type": "calendar" },
    "penalties": {
      "early_termination": { "percentage": 50, "currency": "USD" }
    }
  },
  "payment_policy": {
    "payment_terms": { "type": "prepaid" },
    "currency": "USD",
    "discounts": {
      "early_payment": { "percentage": 5, "days_before_due": 14 }
    }
  }
}
```

This structured approach transforms raw JSONB data into a powerful, user-friendly policy management system that scales with your business needs.

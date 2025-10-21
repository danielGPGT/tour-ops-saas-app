-- Sample data for F1 Tour Operator scenario
-- This demonstrates the JSONB pricing structure with block allocations

-- Insert F1 Tour Operator organization
INSERT INTO organizations (id, name, settings) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 'F1 Tour Operator test', '{"business_type": "sport_events", "specialization": "f1_motogp", "currency": "EUR", "timezone": "Europe/Monaco", "commission_structure": "supplier_based"}')
ON CONFLICT (id) DO NOTHING;

-- Insert suppliers
INSERT INTO suppliers (id, org_id, name, terms, channels, status) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 'Fairmont Palm Dubai', '{"type": "hotel", "specialization": "luxury_accommodation"}', ARRAY['direct', 'agent'], 'active'),
(301, 300, 'F1 Official Tickets', '{"type": "ticket_supplier", "specialization": "f1_tickets"}', ARRAY['direct', 'agent'], 'active'),
(302, 300, 'Monaco Circuit Transfers', '{"type": "transfer_supplier", "specialization": "circuit_transfers"}', ARRAY['direct'], 'active'),
(303, 300, 'Dubai Airport Transfers', '{"type": "transfer_supplier", "specialization": "airport_transfers"}', ARRAY['direct'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert product types
INSERT INTO product_types (id, org_id, name, description) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 'accommodation', 'Hotel accommodations'),
(301, 300, 'event_ticket', 'F1 and MotoGP event tickets'),
(302, 300, 'transfer', 'Airport and circuit transfers')
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, org_id, name, type, status, product_type_id) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 'Fairmont Palm Dubai', 'accommodation', 'active', 300),
(301, 300, 'F1 Monaco Grand Prix 2025', 'event_ticket', 'active', 301),
(302, 300, 'Circuit Transfer', 'transfer', 'active', 302),
(303, 300, 'Airport Transfer', 'transfer', 'active', 302)
ON CONFLICT (id) DO NOTHING;

-- Insert product variants
INSERT INTO product_variants (id, org_id, product_id, name, subtype, status) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 300, 'Standard Room', 'standard', 'active'),
(301, 300, 300, 'Deluxe Room', 'deluxe', 'active'),
(302, 300, 301, 'Grandstand Ticket', 'grandstand', 'active'),
(303, 300, 302, 'Circuit Transfer Per Seat', 'per_seat', 'active'),
(304, 300, 303, 'Airport Transfer Per Vehicle', 'per_vehicle', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert contracts
INSERT INTO contracts (id, org_id, supplier_id, reference, contract_type, status, valid_from, valid_to, currency, commission_rate, terms_and_conditions) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 300, 'HOT-2025-001', 'allocation', 'active', '2025-01-01', '2025-12-31', 'GBP', 10.0, '4-night minimum stay block allocation with extra night availability'),
(301, 300, 301, 'TKT-2025-001', 'net_rate', 'active', '2025-01-01', '2025-12-31', 'GBP', 5.0, 'Official F1 ticket supplier with provisional booking options'),
(302, 300, 302, 'TRF-2025-001', 'allocation', 'active', '2025-01-01', '2025-12-31', 'GBP', 15.0, 'Free sell circuit transfers with post-booking supplier negotiation'),
(303, 300, 303, 'TRF-2025-002', 'allocation', 'active', '2025-01-01', '2025-12-31', 'GBP', 15.0, 'Free sell airport transfers with post-booking supplier negotiation')
ON CONFLICT (id) DO NOTHING;

-- Insert rate plans with JSONB pricing
INSERT INTO rate_plans (id, org_id, product_variant_id, supplier_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, priority, contract_id, rate_type, rate_source) 
OVERRIDING SYSTEM VALUE VALUES 

-- Hotel Supplier Rates (Fairmont Palm Dubai)
(300, 300, 300, 300, 'committed', 'GBP', ARRAY['direct', 'agent'], ARRAY['b2b'], false, '2025-12-01', '2025-12-31', 
'{
  "occupancy": {
    "1": {
      "standard": {
        "block_rate": 950.00,
        "extra_night_rate_before": 1100.00,
        "extra_night_rate_after": 1100.00,
        "model": "fixed"
      },
      "deluxe": {
        "block_rate": 1200.00,
        "extra_night_rate_before": 1400.00,
        "extra_night_rate_after": 1400.00,
        "model": "fixed"
      }
    },
    "2": {
      "standard": {
        "block_rate": 1000.00,
        "extra_night_rate_before": 1200.00,
        "extra_night_rate_after": 1200.00,
        "model": "fixed"
      },
      "deluxe": {
        "block_rate": 1300.00,
        "extra_night_rate_before": 1500.00,
        "extra_night_rate_after": 1500.00,
        "model": "fixed"
      }
    },
    "3": {
      "standard": {
        "block_rate": 1000.00,
        "extra_night_rate_before": 1200.00,
        "extra_night_rate_after": 1200.00,
        "model": "base_plus_pax",
        "per_person": 30.00
      },
      "deluxe": {
        "block_rate": 1300.00,
        "extra_night_rate_before": 1500.00,
        "extra_night_rate_after": 1500.00,
        "model": "base_plus_pax",
        "per_person": 40.00
      }
    }
  },
  "extras": {
    "breakfast": {
      "included": false,
      "per_person": 25.00
    },
    "city_tax": {
      "rate": 0.05,
      "inclusive": false
    },
    "vat": {
      "rate": 0.20,
      "inclusive": false
    }
  },
  "contract_terms": {
    "min_stay": 4,
    "block_dates": ["2025-12-04", "2025-12-07"],
    "extra_night_availability": {
      "before_block": true,
      "after_block": true,
      "max_extra_nights": 3
    },
    "rooming_list_deadline": "2025-11-15"
  }
}', 100, 300, 'supplier_rate', null),

-- Hotel Master Rates (Selling Prices)
(301, 300, 300, NULL, NULL, 'GBP', '2025-12-01', '2025-12-31',
'{
  "occupancy": {
    "1": {
      "standard": {
        "block_rate": 1200.00,
        "extra_night_rate_before": 1400.00,
        "extra_night_rate_after": 1400.00,
        "model": "fixed"
      },
      "deluxe": {
        "block_rate": 1500.00,
        "extra_night_rate_before": 1700.00,
        "extra_night_rate_after": 1700.00,
        "model": "fixed"
      }
    },
    "2": {
      "standard": {
        "block_rate": 1300.00,
        "extra_night_rate_before": 1500.00,
        "extra_night_rate_after": 1500.00,
        "model": "fixed"
      },
      "deluxe": {
        "block_rate": 1600.00,
        "extra_night_rate_before": 1800.00,
        "extra_night_rate_after": 1800.00,
        "model": "fixed"
      }
    }
  }
}', 'block', 'master_rate', 'committed'),

-- Ticket Supplier Rates
(302, 300, 302, 301, 301, 'GBP', '2025-12-01', '2025-12-31',
'{
  "suppliers": {
    "official": {
      "rate": 800.00,
      "availability": "committed",
      "priority": 100
    },
    "reseller_a": {
      "rate": 750.00,
      "availability": "committed",
      "priority": 90
    },
    "reseller_b": {
      "rate": 820.00,
      "availability": "committed",
      "priority": 80
    }
  },
  "provisional": {
    "enabled": true,
    "estimated_rate": 800.00,
    "confirmation_deadline": "2025-11-30"
  },
  "adhoc": {
    "enabled": true,
    "estimated_rate": 900.00,
    "risk_margin": 0.15
  }
}', 'block', 'supplier_rate', 'committed'),

-- Circuit Transfer Rates (Free Sell)
(303, 300, 303, 302, 302, 'GBP', '2025-12-01', '2025-12-31',
'{
  "pricing_model": "freesale",
  "unit_types": {
    "per_seat": {
      "estimated_rate": 25.00,
      "margin": 0.30
    },
    "per_vehicle": {
      "estimated_rate": 400.00,
      "capacity": 16,
      "margin": 0.25
    }
  },
  "logistics": {
    "planning_deadline": "2025-11-20",
    "supplier_negotiation": "post_booking"
  }
}', 'block', 'supplier_rate', 'freesale'),

-- Airport Transfer Rates (Free Sell)
(304, 300, 304, 303, 303, 'GBP', '2025-12-01', '2025-12-31',
'{
  "pricing_model": "freesale",
  "transfer_types": {
    "inbound": {
      "per_vehicle": {
        "estimated_rate": 150.00,
        "capacity": 8,
        "margin": 0.25
      },
      "per_seat": {
        "estimated_rate": 20.00,
        "margin": 0.30
      }
    },
    "outbound": {
      "per_vehicle": {
        "estimated_rate": 150.00,
        "capacity": 8,
        "margin": 0.25
      },
      "per_seat": {
        "estimated_rate": 20.00,
        "margin": 0.30
      }
    }
  },
  "logistics": {
    "planning_deadline": "2025-11-20",
    "supplier_negotiation": "post_booking"
  }
}', 'block', 'supplier_rate', 'freesale')
ON CONFLICT (id) DO NOTHING;

-- Insert block allocations
INSERT INTO allocation_buckets (id, org_id, product_variant_id, supplier_id, contract_id, date, allocation_type, quantity, booked, held, base_cost, currency, block_type, block_start_date, block_end_date, min_stay, max_stay) 
OVERRIDING SYSTEM VALUE VALUES 

-- Hotel block allocation (Dec 4-7)
(300, 300, 300, 300, 300, '2025-12-04', 'committed', 70, 0, 0, 1000.00, 'GBP', 'block', '2025-12-04', '2025-12-07', 4, 4),
(301, 300, 301, 300, 300, '2025-12-04', 'committed', 30, 0, 0, 1300.00, 'GBP', 'block', '2025-12-04', '2025-12-07', 4, 4),

-- Extra night allocations (before and after block)
(302, 300, 300, 300, 300, '2025-12-02', 'committed', 20, 0, 0, 1200.00, 'GBP', 'extra_before', '2025-12-02', '2025-12-03', 1, 3),
(303, 300, 300, 300, 300, '2025-12-08', 'committed', 20, 0, 0, 1200.00, 'GBP', 'extra_after', '2025-12-08', '2025-12-09', 1, 3),

-- Ticket allocations
(304, 300, 302, 301, 301, '2025-12-07', 'committed', 100, 0, 0, 800.00, 'GBP', 'block', '2025-12-07', '2025-12-07', 1, 1),

-- Transfer allocations (free sell - no quantity limits)
(305, 300, 303, 302, 302, '2025-12-07', 'freesale', NULL, 0, 0, 25.00, 'GBP', 'block', '2025-12-07', '2025-12-07', 1, 1),
(306, 300, 304, 303, 303, '2025-12-04', 'freesale', NULL, 0, 0, 150.00, 'GBP', 'block', '2025-12-04', '2025-12-04', 1, 1),
(307, 300, 304, 303, 303, '2025-12-08', 'freesale', NULL, 0, 0, 150.00, 'GBP', 'block', '2025-12-08', '2025-12-08', 1, 1)
ON CONFLICT (id) DO NOTHING;

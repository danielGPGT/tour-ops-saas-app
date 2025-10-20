-- Seed data for contracts with org_id 200
-- This matches the new simplified contract schema

-- First, let's add some suppliers if they don't exist
INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'Grand Hotel Paris', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Grand Hotel Paris' AND org_id = 200);

INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'Louvre Museum Tours', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Louvre Museum Tours' AND org_id = 200);

INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'Eiffel Tower Experiences', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Eiffel Tower Experiences' AND org_id = 200);

INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'Seine River Cruises', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Seine River Cruises' AND org_id = 200);

INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'Versailles Palace Tours', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Versailles Palace Tours' AND org_id = 200);

-- Insert contracts
INSERT INTO contracts (
  org_id, supplier_id, reference, status, contract_type, 
  signed_date, signed_document_url, terms_and_conditions, 
  special_terms, notes, created_at, updated_at
) VALUES
(
  200, (SELECT id FROM suppliers WHERE name = 'Grand Hotel Paris' AND org_id = 200), 'GHP-2024-SUMMER', 'active', 'net_rate',
  '2024-01-15', 'https://supabase.co/storage/v1/object/public/contracts/ghp-2024-summer-signed.pdf',
  'STANDARD HOTEL CONTRACT TERMS

1. RATES & PRICING
- Net rates as per rate sheet attached
- Rates valid June 1 - August 31, 2024
- All rates in EUR, exclusive of VAT
- Rate increases: 5% from July 1st

2. CANCELLATION POLICY
- 30+ days before: 25% penalty
- 14-29 days before: 50% penalty  
- 7-13 days before: 75% penalty
- <7 days before: 100% penalty
- Groups 15+: Free cancellation up to 14 days
- Force majeure: Full refund

3. PAYMENT TERMS
- Standard: 30% deposit within 7 days
- Final payment: 45 days before arrival
- Last minute (<7 days): Full payment required
- Corporate accounts: Net 30 from invoice

4. ALLOCATION & ATTRITION
- Guaranteed allocation: 300 room nights
- Minimum pickup: 80% per month
- Penalty: Pay for unused at contract rate
- Release deadline: 1st of each month',
  'SPECIAL TERMS:
- 10% discount for bookings 50+ rooms
- Complimentary upgrade for VIP clients  
- Christmas period (Dec 20-27): Different rate sheet
- Weekly payment preferred, net-7 terms
- Last room availability guaranteed for emergencies',
  'Primary Contact: Marie Dubois (marie@grandhotel.com)
Phone: +33 1 234 5678
WhatsApp: Preferred for urgent matters
Relationship Manager: John Smith
Invoice Day: 1st of month
Payment: Bank transfer, 7 days',
  NOW(), NOW()
),
(
  200, (SELECT id FROM suppliers WHERE name = 'Louvre Museum Tours' AND org_id = 200), 'LMT-2024-TOURS', 'active', 'commissionable',
  '2024-02-01', 'https://supabase.co/storage/v1/object/public/contracts/lmt-2024-tours-signed.pdf',
  'MUSEUM TOUR CONTRACT TERMS

1. RATES & COMMISSION
- Net rates as per attached schedule
- Commission: 15% on all bookings
- Rates valid March 1 - December 31, 2024
- Currency: EUR

2. BOOKING CONDITIONS
- Minimum 24 hours advance booking
- Maximum group size: 25 people
- Audio guides included
- Skip-the-line access guaranteed

3. CANCELLATION POLICY
- 48+ hours: Free cancellation
- 24-47 hours: 50% penalty
- <24 hours: 100% penalty
- Weather cancellations: Full refund

4. PAYMENT TERMS
- Commission paid monthly
- Payment within 30 days of invoice
- Minimum commission: €500/month',
  'SPECIAL ARRANGEMENTS:
- Private tours available for groups 15+
- Photography permits included
- Educational discounts for schools
- Corporate packages available',
  'Contact: Pierre Martin (pierre@louvre-tours.com)
Phone: +33 1 987 6543
Email confirmations required
Monthly reporting on commission earned',
  NOW(), NOW()
),
(
  200, (SELECT id FROM suppliers WHERE name = 'Eiffel Tower Experiences' AND org_id = 200), 'ETE-2024-EXPERIENCES', 'active', 'allocation',
  '2024-01-20', 'https://supabase.co/storage/v1/object/public/contracts/ete-2024-experiences-signed.pdf',
  'EIFFEL TOWER ALLOCATION CONTRACT

1. ALLOCATION COMMITMENT
- Guaranteed slots: 200 per month
- Peak season (June-Aug): 300 per month
- Off-peak (Nov-Feb): 150 per month
- Time slots: 9am, 11am, 2pm, 4pm

2. ATTRITION TERMS
- Minimum pickup: 85% of allocation
- Penalty for unused: €25 per slot
- Over-usage: €30 per additional slot
- Release deadline: 15th of previous month

3. RATES & PAYMENT
- Peak season: €45 per person
- Off-peak: €35 per person
- Payment: Net 30 days
- Currency: EUR

4. OPERATIONAL REQUIREMENTS
- Group size: 8-20 people
- Guide required for all tours
- Insurance coverage mandatory',
  'SPECIAL PROVISIONS:
- VIP access for groups 15+
- Photography sessions available
- Sunset tours: +€10 per person
- Private elevator access: +€15 per person',
  'Operations Manager: Sophie Laurent
Phone: +33 1 555 1234
Email: sophie@eiffel-experiences.com
Daily slot confirmations required
Monthly performance reviews',
  NOW(), NOW()
),
(
  200, (SELECT id FROM suppliers WHERE name = 'Seine River Cruises' AND org_id = 200), 'SRC-2024-CRUISES', 'active', 'net_rate',
  '2024-03-01', 'https://supabase.co/storage/v1/object/public/contracts/src-2024-cruises-signed.pdf',
  'SEINE RIVER CRUISE CONTRACT

1. RATES & SCHEDULING
- Lunch cruise: €65 per person
- Dinner cruise: €95 per person
- Sunset cruise: €45 per person
- Private charters: €2,500 minimum

2. BOOKING CONDITIONS
- Minimum 48 hours advance booking
- Maximum capacity: 200 passengers
- Weather policy: Full refund if cancelled
- Boarding: 15 minutes before departure

3. CANCELLATION POLICY
- 7+ days: Free cancellation
- 3-6 days: 25% penalty
- 1-2 days: 50% penalty
- Same day: 100% penalty

4. PAYMENT TERMS
- Deposit: 30% at booking
- Final payment: 7 days before cruise
- Corporate accounts: Net 30',
  'SPECIAL SERVICES:
- Live music on dinner cruises
- Wine tasting packages available
- Corporate event planning
- Photography services on board',
  'Captain: Jean Dubois
Phone: +33 1 777 8888
Email: jean@seine-cruises.com
Weather updates: Daily at 8am
Boarding location: Port de la Bourdonnais',
  NOW(), NOW()
),
(
  200, (SELECT id FROM suppliers WHERE name = 'Versailles Palace Tours' AND org_id = 200), 'VPT-2024-PALACE', 'active', 'commissionable',
  '2024-02-15', 'https://supabase.co/storage/v1/object/public/contracts/vpt-2024-palace-signed.pdf',
  'VERSAILLES PALACE TOUR CONTRACT

1. COMMISSION STRUCTURE
- Base rate: €40 per person
- Commission: 12% on all bookings
- Group discounts: 5% for 10+ people
- Private tours: €80 per person

2. TOUR SCHEDULES
- Morning tours: 9am, 10am, 11am
- Afternoon tours: 2pm, 3pm, 4pm
- Full day tours: 9am-5pm
- Evening tours: 6pm-8pm (summer only)

3. BOOKING REQUIREMENTS
- Minimum 24 hours advance booking
- Maximum group size: 30 people
- Audio guides: €5 per person
- Palace entry included

4. CANCELLATION TERMS
- 48+ hours: Free cancellation
- 24-47 hours: 25% penalty
- <24 hours: 50% penalty
- Weather: Full refund',
  'SPECIAL ARRANGEMENTS:
- Garden tours available
- Photography permits included
- Educational programs for schools
- Corporate team building events',
  'Tour Manager: Claire Moreau
Phone: +33 1 999 0000
Email: claire@versailles-tours.com
Meeting point: Palace main entrance
Audio guide languages: 8 languages available',
  NOW(), NOW()
);

-- Insert contract versions for each contract
INSERT INTO contract_versions (
  org_id, contract_id, valid_from, valid_to, commission_rate, 
  currency, booking_cutoff_days, cancellation_policies, payment_policies,
  created_at, updated_at
) VALUES
(
  200, (SELECT id FROM contracts WHERE reference = 'GHP-2024-SUMMER' AND org_id = 200), '2024-06-01', '2024-08-31', NULL, 'EUR', 3,
  '[{"id": "standard", "name": "Standard Hotel", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "rules": [{"days_before": 30, "penalty_percent": 25}, {"days_before": 14, "penalty_percent": 50}, {"days_before": 7, "penalty_percent": 75}, {"days_before": 0, "penalty_percent": 100}]}]',
  '[{"id": "standard", "name": "Standard Payment", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "schedule": [{"type": "deposit", "amount_type": "percent", "amount": 30, "due_timing": "after_booking", "due_days": 7}, {"type": "final", "amount_type": "remaining", "due_timing": "before_service", "due_days": 45}]}]',
  NOW(), NOW()
),
(
  200, (SELECT id FROM contracts WHERE reference = 'LMT-2024-TOURS' AND org_id = 200), '2024-03-01', '2024-12-31', 15, 'EUR', 1,
  '[{"id": "museum", "name": "Museum Tours", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "rules": [{"days_before": 2, "penalty_percent": 0}, {"days_before": 1, "penalty_percent": 50}, {"days_before": 0, "penalty_percent": 100}]}]',
  '[{"id": "commission", "name": "Commission Payment", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "schedule": [{"type": "commission", "amount_type": "percent", "amount": 15, "due_timing": "after_service", "due_days": 30}]}]',
  NOW(), NOW()
),
(
  200, (SELECT id FROM contracts WHERE reference = 'ETE-2024-EXPERIENCES' AND org_id = 200), '2024-01-01', '2024-12-31', NULL, 'EUR', 7,
  '[{"id": "allocation", "name": "Allocation Tours", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "rules": [{"days_before": 15, "penalty_percent": 0}, {"days_before": 7, "penalty_percent": 25}, {"days_before": 0, "penalty_percent": 100}]}]',
  '[{"id": "allocation", "name": "Allocation Payment", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "schedule": [{"type": "allocation", "amount_type": "fixed", "amount": 25, "due_timing": "monthly", "due_days": 30}]}]',
  NOW(), NOW()
),
(
  200, (SELECT id FROM contracts WHERE reference = 'SRC-2024-CRUISES' AND org_id = 200), '2024-03-01', '2024-12-31', NULL, 'EUR', 2,
  '[{"id": "cruise", "name": "River Cruises", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "rules": [{"days_before": 7, "penalty_percent": 0}, {"days_before": 3, "penalty_percent": 25}, {"days_before": 1, "penalty_percent": 50}, {"days_before": 0, "penalty_percent": 100}]}]',
  '[{"id": "cruise", "name": "Cruise Payment", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "schedule": [{"type": "deposit", "amount_type": "percent", "amount": 30, "due_timing": "after_booking", "due_days": 7}, {"type": "final", "amount_type": "remaining", "due_timing": "before_service", "due_days": 7}]}]',
  NOW(), NOW()
),
(
  200, (SELECT id FROM contracts WHERE reference = 'VPT-2024-PALACE' AND org_id = 200), '2024-02-15', '2024-12-31', 12, 'EUR', 1,
  '[{"id": "palace", "name": "Palace Tours", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "rules": [{"days_before": 2, "penalty_percent": 0}, {"days_before": 1, "penalty_percent": 25}, {"days_before": 0, "penalty_percent": 50}]}]',
  '[{"id": "palace", "name": "Palace Payment", "is_default": true, "priority": 100, "applies_to": {"conditions": []}, "schedule": [{"type": "commission", "amount_type": "percent", "amount": 12, "due_timing": "after_service", "due_days": 30}]}]',
  NOW(), NOW()
);

-- Insert some contract deadlines
INSERT INTO contract_deadlines (
  org_id, ref_type, ref_id, deadline_type, deadline_date, 
  penalty_type, penalty_value, status, notes, created_at, updated_at
) VALUES
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'GHP-2024-SUMMER' AND org_id = 200), 'payment', '2024-07-01', 'percentage', 5, 'pending', 'Rate increase effective', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'GHP-2024-SUMMER' AND org_id = 200), 'release', '2024-05-01', 'fixed_amount', 50, 'pending', 'Release unsold summer inventory', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'LMT-2024-TOURS' AND org_id = 200), 'final_numbers', '2024-11-30', 'none', 0, 'pending', 'Final numbers for winter season', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'ETE-2024-EXPERIENCES' AND org_id = 200), 'attrition', '2024-06-30', 'fixed_amount', 25, 'pending', 'Mid-year attrition review', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'SRC-2024-CRUISES' AND org_id = 200), 'cancellation', '2024-12-15', 'percentage', 10, 'pending', 'Holiday season booking deadline', NOW(), NOW());

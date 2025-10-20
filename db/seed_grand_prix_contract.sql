-- Seed data for Grand Prix Grand Tours contract
-- This is a real-world example contract with all the details

-- First, ensure we have the supplier (NH Collection Milano Porta Nuova)
INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'NH Collection Milano Porta Nuova', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'NH Collection Milano Porta Nuova' AND org_id = 200);

-- Create the main contract
INSERT INTO contracts (
  org_id, supplier_id, reference, status, contract_type, 
  signed_date, signed_document_url, terms_and_conditions, 
  special_terms, notes, created_at, updated_at
) VALUES
(
  200, 
  (SELECT id FROM suppliers WHERE name = 'NH Collection Milano Porta Nuova' AND org_id = 200 LIMIT 1), 
  'MB0004574600', 
  'active', 
  'commissionable',
  '2025-08-27', 
  'https://supabase.co/storage/v1/object/public/contracts/grand-prix-grand-tours-contract.pdf',
  'CONTRACT TERMS AND CONDITIONS

GRAND PRIX GRAND TOURS
RIVERBANK HOUSE 1 PUTNEY
SW63JD, LONDON
United Kingdom
Tel: 442039665680
Email: james@grandprixgrandtours.com

Milano 27.08.2025
Reference Number MB0004574600 Group Dates 04.09.2026 / 07.09.2026
Voucher MQ0001264803 Persons / Room 25 /50
Currency EUR

Group name GRAND PRIX GRAD TOUR

NH COLLECTION MILANO PORTA NUOVA Via Melchiorre Gioia 6, 20124 Milano – Tel +39 02 62371

QUOTATION
04.09.2026 - 07.09.2026 Price excl. VAT VAT Total Price incl. VAT
NH Collection Porta Nuova
Hotel Reservations 25.840,92 2.584,08 28.425,00
City Tax 525,00 0,00 525,00
Total 26.365,92 2.584,08 28.950,00
Currency EUR
Room VAT: 10,00%
F&B Services VAT: 10,00%

ACCOMMODATION
Bed and Breakfast
Number of Rooms Category Room Occupancy Price excl. VAT VAT Price per room incl. VAT

NH Collection Porta Nuova 25AD
04.09.2026
25 ROH DUS 1AD 344,55 34,45 379,00
05.09.2026
25 ROH DUS 1AD 344,55 34,45 379,00
06.09.2026
25 ROH DUS 1AD 344,55 34,45 379,00
SUPPLEMENT DOUBLE ROOM € 20.00 PER ROOM PER NIGHT CITY TAX EXCLUDE

Room type: RUN OF HOUSE: rooms'' category undefined, assignment upon arrival.

ARRIVAL AND DEPARTURE
The rooms are reserved from 15:00 on the day of arrival to 12:00 on the day of departure. Guests arriving before 15:00 will be provided with a room based on availability.

ROOMING LIST
The hotel requires a full rooming list 15 days prior to the arrival date. Any specific requirements with regards to individual guests must be indicated on this rooming list with the following details: name + family name + place and date of birth, nationality, passport number.

CITY TAX
City tax per person per night
NH Collection Milano: Euro 7,00

COMMISSIONS
The commission contributes 10% on the net VAT rates and it will be calculated on the following contracted services:
• Accommodation

Commissions on cancellation costs
In case of total or partial cancellation of the business, all payments that may incur cancellation costs will be commissionable as agreed in the initial event negotiation.
With the exception of the first deposit, for which up to a maximum 10% of the total value will not be commissionable.

PAYMENT PROCEDURE
Non-refundable deposit, as per art. 1385 C.C. divided into following not refundable tranches:
10% of total value to be paid once the contract is signed EURO 2.895,00
40% of total value to be paid 180 days before arrival date
40% of total value to be paid 90 days before arrival date
Balance: 10% of total value to be paid 45 days before arrival date

BANK DETAILS
Bank transfer to the hotel''s bank account
NH COLLECTION MILANO PORTA NUOVA
IBAN: IT 88 Y 01005 01600 0000 0001 3137
SWIFT CODE: BNLIITRRXXX
NH ITALIA SPA
Via G.B. Pergolesi 2A
20124 Milano
ITALIA
P IVA 04440220962

CANCELLATION CONDITIONS
From contract signature up to 180 days prior to arrival date: 90% of reserved services on a daily basis can be cancelled without fee.
From 179 to 90 days prior to arrival date: 50% of reserved services on a daily basis can be cancelled without fee.
During the 89 days prior to arrival date: any cancellation is charged 100% with the exception of 1 room or 1 participant that can be cancelled without fee until 3 days before arrival.

NO SHOW
No shows are charged 100%, net VAT 10%.
Late arrivals, early departures or any cancellation during the event are charged 100%.

FORCE MAJEURE
The Client and the Hotel may cancel this Agreement without liability in case of force majeure, being force majeure any unforeseeable circumstances occurred after the signing of the Agreement, which are unavoidable and make it impossible to comply with the obligations of the Agreement by the party that invokes it.

DISPUTE RESOLUTION
The Agreement is governed by and construed with the laws of Italy. The place of jurisdiction for any and all disputes arising from this Agreement is Milan, Italy.',
  
  'SPECIAL TERMS AND CONDITIONS

SUSTAINABLE MEETINGS & EVENTS – UP FOR PLANET & PEOPLE
An event at Minor Hotels Europe & Americas is more than an event, it is the possibility of offering a SUSTAINABLE MEETING & EVENT. In our commitment to create a positive impact to the Planet and the People, we work to ensure that every event held at one of our hotels has the least possible impact on the environment.

CARBON NEUTRAL EVENT
We are pleased to inform you that your event meets the Minor Hotels Europe & Americas criteria to become a CARBON NEUTRAL EVENT, in line with the company''s commitment to tackling climate change.

S.I.A.E. PROCEDURES
The entertainments organized at the hotel are subject to obtaining a permission from the S.I.A.E. The handling of the related files must be handled directly by the customer in his own name at the office of competence.

SECURITY RULES
The following safety rules must be respected by the tenant:
PROHIBITIONS:
- SMOKING IS PROHIBITED during the preparation and use of the room.
- Do not obstruct the firefighting devices and emergency signs present in the given leasehold area.
- Do not lean or hang items from structural fittings, furnishings or windows.
- Do not deposit inflammable liquids inside the given leasehold area.

OBLIGATIONS:
- Immediately notify NH Italia S.p.A of any anomalies or damages that arise.
- Respect the maximum capacity of the room.
- In case of emergency call immediately the reception of the hotel.
- All materials shall be perfectly identified with the name of the group and dates.',
  
  'INTERNAL NOTES:
Contact: Renza Tomera - NH Group & Events Management Team
Email: nhgroupsales1.it@nh-hotels.com
Phone: 0039 02 87361997
Address: Italy Milan GEM, Strada 1 Milanofiori, 20057 Assago

Client Contact: James (Grand Prix Grand Tours)
Email: james@grandprixgrandtours.com
Phone: 442039665680
Address: Riverbank House 1 Putney, SW63JD, London, United Kingdom

Event Details:
- Group: Grand Prix Grand Tours
- Dates: September 4-7, 2026
- Rooms: 25 rooms, 50 persons
- Total Value: €28,950.00
- Commission: 10% (€2,895.00)
- Voucher: MQ0001264803

Special Requirements:
- Carbon neutral event
- SIAE procedures required for entertainment
- Rooming list due 15 days before arrival
- Setup/decoration project due 30 days before event',
  NOW(), 
  NOW()
);

-- Create contract version with detailed policies
INSERT INTO contract_versions (
  org_id, contract_id, valid_from, valid_to, commission_rate, 
  currency, booking_cutoff_days, cancellation_policies, payment_policies,
  created_at, updated_at
) VALUES
(
  200, 
  (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 
  '2025-08-27', 
  '2026-09-07', 
  10.0, 
  'EUR', 
  15,
  '[{
    "id": "standard",
    "name": "Standard Cancellation Policy",
    "is_default": true,
    "priority": 100,
    "applies_to": {"conditions": []},
    "rules": [
      {"days_before": 180, "penalty_percent": 0, "description": "90% can be cancelled without fee"},
      {"days_before": 90, "penalty_percent": 50, "description": "50% can be cancelled without fee"},
      {"days_before": 0, "penalty_percent": 100, "description": "100% penalty, except 1 room/participant until 3 days before"}
    ]
  }]',
  '[{
    "id": "standard",
    "name": "Standard Payment Schedule",
    "is_default": true,
    "priority": 100,
    "applies_to": {"conditions": []},
    "schedule": [
      {"type": "deposit", "amount_type": "percent", "amount": 10, "due_timing": "after_contract_signature", "due_days": 0, "amount_value": 2895.00},
      {"type": "payment", "amount_type": "percent", "amount": 40, "due_timing": "before_arrival", "due_days": 180},
      {"type": "payment", "amount_type": "percent", "amount": 40, "due_timing": "before_arrival", "due_days": 90},
      {"type": "final", "amount_type": "percent", "amount": 10, "due_timing": "before_arrival", "due_days": 45}
    ]
  }]',
  NOW(), 
  NOW()
);

-- Create contract deadlines
INSERT INTO contract_deadlines (
  org_id, ref_type, ref_id, deadline_type, deadline_date, 
  penalty_type, penalty_value, status, notes, created_at, updated_at
) VALUES
-- Contract return deadline
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'contract_return', '2025-08-29', 'none', 0, 'pending', 'Return signed contract to hotel office', NOW(), NOW()),

-- Payment deadlines
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'payment', '2026-03-08', 'percentage', 100, 'pending', '40% payment due (180 days before arrival)', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'payment', '2026-06-06', 'percentage', 100, 'pending', '40% payment due (90 days before arrival)', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'payment', '2026-07-22', 'percentage', 100, 'pending', 'Final 10% payment due (45 days before arrival)', NOW(), NOW()),

-- Operational deadlines
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'rooming_list', '2026-08-20', 'none', 0, 'pending', 'Rooming list due (15 days before arrival)', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'setup_project', '2026-08-05', 'none', 0, 'pending', 'Setup/decoration project due (30 days before event)', NOW(), NOW()),

-- Event dates
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'event_start', '2026-09-04', 'none', 0, 'pending', 'Event start date', NOW(), NOW()),
(200, 'contract', (SELECT id FROM contracts WHERE reference = 'MB0004574600' AND org_id = 200 LIMIT 1), 'event_end', '2026-09-07', 'none', 0, 'pending', 'Event end date', NOW(), NOW());

-- Create some additional suppliers for variety
INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'Grand Prix Grand Tours', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Grand Prix Grand Tours' AND org_id = 200);

INSERT INTO suppliers (org_id, name, status, created_at, updated_at) 
SELECT 200, 'Minor Hotels Europe', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Minor Hotels Europe' AND org_id = 200);

-- Create a few more contracts for testing
INSERT INTO contracts (
  org_id, supplier_id, reference, status, contract_type, 
  signed_date, terms_and_conditions, notes, created_at, updated_at
) VALUES
(
  200, 
  (SELECT id FROM suppliers WHERE name = 'Grand Prix Grand Tours' AND org_id = 200 LIMIT 1), 
  'GPT-2024-F1', 
  'active', 
  'net_rate',
  '2024-01-15', 
  'F1 Grand Prix Tour Contract - Net Rate Agreement',
  'F1 Grand Prix tour contract with net rate pricing',
  NOW(), 
  NOW()
),
(
  200, 
  (SELECT id FROM suppliers WHERE name = 'Minor Hotels Europe' AND org_id = 200 LIMIT 1), 
  'MHE-2024-ALLOCATION', 
  'draft', 
  'allocation',
  NULL, 
  'Allocation-based contract for hotel rooms',
  'Draft allocation contract for hotel inventory',
  NOW(), 
  NOW()
);

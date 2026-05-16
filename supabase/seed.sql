-- ============================================================
-- GARAGE ERP - SEED DATA (Dubai / UAE realistic data)
-- Run AFTER schema.sql in Supabase → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────
-- MECHANICS (7 mechanics – realistic Dubai garage mix)
-- ─────────────────────────────────────────
insert into mechanics (id, name, phone, email, status) values
  ('a1000000-0000-0000-0000-000000000001', 'Rashid Al-Mansoori', '+971501112233', 'rashid@garageerp.ae', 'active'),
  ('a1000000-0000-0000-0000-000000000002', 'Ahmed Hassan',        '+971552223344', 'ahmed.h@garageerp.ae', 'active'),
  ('a1000000-0000-0000-0000-000000000003', 'Fahad Al-Qasimi',     '+971563334455', 'fahad@garageerp.ae', 'active'),
  ('a1000000-0000-0000-0000-000000000004', 'Mohammed Khalid',     '+971504445566', 'mohammed.k@garageerp.ae', 'active'),
  ('a1000000-0000-0000-0000-000000000005', 'Rajan Kumar',         '+971555556677', 'rajan@garageerp.ae', 'active'),
  ('a1000000-0000-0000-0000-000000000006', 'Suresh Nair',         '+971566667788', 'suresh@garageerp.ae', 'active'),
  ('a1000000-0000-0000-0000-000000000007', 'Bilal Siddiqui',      '+971507778899', 'bilal@garageerp.ae', 'inactive');

-- ─────────────────────────────────────────
-- SERVICES (15 services with AED pricing)
-- ─────────────────────────────────────────
insert into services (id, name, cost, description) values
  ('b1000000-0000-0000-0000-000000000001', 'Oil Change',                  120.00, 'Engine oil drain and refill'),
  ('b1000000-0000-0000-0000-000000000002', 'Battery Replacement',         350.00, 'Replace car battery and test charging system'),
  ('b1000000-0000-0000-0000-000000000003', 'Tire Rotation',                80.00, 'Rotate all 4 tires for even wear'),
  ('b1000000-0000-0000-0000-000000000004', 'Brake Pad Replacement',       450.00, 'Replace front or rear brake pads'),
  ('b1000000-0000-0000-0000-000000000005', 'Air Filter Replacement',       90.00, 'Replace engine air filter'),
  ('b1000000-0000-0000-0000-000000000006', 'Spark Plug Replacement',      180.00, 'Replace all spark plugs'),
  ('b1000000-0000-0000-0000-000000000007', 'AC Service & Recharge',       250.00, 'AC gas recharge and system check'),
  ('b1000000-0000-0000-0000-000000000008', 'Wheel Alignment',             100.00, '4-wheel computerized alignment'),
  ('b1000000-0000-0000-0000-000000000009', 'Full Service Package',        750.00, 'Oil, filter, plugs, and full inspection'),
  ('b1000000-0000-0000-0000-000000000010', 'Radiator Flush',              200.00, 'Full coolant system flush and refill'),
  ('b1000000-0000-0000-0000-000000000011', 'Transmission Service',        500.00, 'Transmission fluid change and filter'),
  ('b1000000-0000-0000-0000-000000000012', 'Suspension Inspection',       150.00, 'Full suspension and steering check'),
  ('b1000000-0000-0000-0000-000000000013', 'Engine Diagnostic Scan',      200.00, 'OBD-II scan and fault code report'),
  ('b1000000-0000-0000-0000-000000000014', 'Windshield Replacement',      800.00, 'Full windshield glass replacement'),
  ('b1000000-0000-0000-0000-000000000015', 'Exhaust Repair',              300.00, 'Exhaust pipe weld or replacement');

-- ─────────────────────────────────────────
-- PARTS (20 parts with AED pricing)
-- ─────────────────────────────────────────
insert into parts (id, name, cost, unit, stock_level) values
  ('c1000000-0000-0000-0000-000000000001', 'Engine Oil 5W-30 (5L)',     85.00,  'bottle',  24),
  ('c1000000-0000-0000-0000-000000000002', 'Oil Filter',                35.00,  'piece',   30),
  ('c1000000-0000-0000-0000-000000000003', 'Air Filter',                60.00,  'piece',   18),
  ('c1000000-0000-0000-0000-000000000004', 'Fuel Filter',               45.00,  'piece',   12),
  ('c1000000-0000-0000-0000-000000000005', 'Brake Pads (Front Set)',    180.00, 'set',      8),
  ('c1000000-0000-0000-0000-000000000006', 'Brake Pads (Rear Set)',     160.00, 'set',      8),
  ('c1000000-0000-0000-0000-000000000007', 'Car Battery 70Ah',         280.00, 'piece',    6),
  ('c1000000-0000-0000-0000-000000000008', 'Spark Plugs (Set of 4)',    120.00, 'set',     10),
  ('c1000000-0000-0000-0000-000000000009', 'Wiper Blades (Pair)',        65.00, 'pair',    15),
  ('c1000000-0000-0000-0000-000000000010', 'Coolant Antifreeze (1L)',    25.00, 'liter',   20),
  ('c1000000-0000-0000-0000-000000000011', 'Power Steering Fluid',       30.00, 'bottle',  12),
  ('c1000000-0000-0000-0000-000000000012', 'Transmission Fluid (1L)',    45.00, 'liter',   14),
  ('c1000000-0000-0000-0000-000000000013', 'Brake Fluid DOT4',           20.00, 'bottle',  16),
  ('c1000000-0000-0000-0000-000000000014', 'Serpentine Belt',            95.00, 'piece',    7),
  ('c1000000-0000-0000-0000-000000000015', 'Timing Belt',               250.00, 'piece',    4),
  ('c1000000-0000-0000-0000-000000000016', 'Radiator Cap',               40.00, 'piece',   10),
  ('c1000000-0000-0000-0000-000000000017', 'Thermostat',                 85.00, 'piece',    6),
  ('c1000000-0000-0000-0000-000000000018', 'Water Pump',                220.00, 'piece',    4),
  ('c1000000-0000-0000-0000-000000000019', 'Alternator',                650.00, 'piece',    2),
  ('c1000000-0000-0000-0000-000000000020', 'Starter Motor',             480.00, 'piece',    2);

-- ─────────────────────────────────────────
-- CUSTOMERS (10 UAE customers)
-- ─────────────────────────────────────────
insert into customers (id, name, phone, email) values
  ('d1000000-0000-0000-0000-000000000001', 'Ahmed Al-Rashid',  '+971501234567', 'ahmed.rashid@gmail.com'),
  ('d1000000-0000-0000-0000-000000000002', 'Sara Mohammed',    '+971552345678', 'sara.m@hotmail.com'),
  ('d1000000-0000-0000-0000-000000000003', 'Khalid Ibrahim',   '+971563456789', 'khalid.ibrahim@yahoo.com'),
  ('d1000000-0000-0000-0000-000000000004', 'Fatima Hassan',    '+971584567890', 'fatima.h@gmail.com'),
  ('d1000000-0000-0000-0000-000000000005', 'Omar Abdullah',    '+971505678901', 'omar.abd@outlook.com'),
  ('d1000000-0000-0000-0000-000000000006', 'Layla Nasser',     '+971556789012', 'layla.n@gmail.com'),
  ('d1000000-0000-0000-0000-000000000007', 'Zayed Al-Falasi',  '+971567890123', 'zayed.falasi@gmail.com'),
  ('d1000000-0000-0000-0000-000000000008', 'Hana Mahmoud',     '+971588901234', 'hana.m@yahoo.com'),
  ('d1000000-0000-0000-0000-000000000009', 'Tariq Yusuf',      '+971509012345', 'tariq.y@hotmail.com'),
  ('d1000000-0000-0000-0000-000000000010', 'Nour Al-Din',      '+971550123456', 'nour.aldin@gmail.com');

-- ─────────────────────────────────────────
-- VEHICLES
-- ─────────────────────────────────────────
insert into vehicles (id, customer_id, make, model, license_plate, year) values
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Toyota',   'Camry',       'DXB-A-12345', 2021),
  ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'Honda',    'Accord',      'DXB-B-23456', 2020),
  ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'Nissan',   'Patrol',      'DXB-C-34567', 2022),
  ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'Toyota',   'Land Cruiser','DXB-D-45678', 2023),
  ('e1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 'BMW',      '5 Series',    'DXB-E-56789', 2021),
  ('e1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 'Mercedes', 'E-Class',     'DXB-F-67890', 2022),
  ('e1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000007', 'Hyundai',  'Sonata',      'DXB-G-78901', 2020),
  ('e1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000008', 'Toyota',   'Corolla',     'DXB-H-89012', 2019),
  ('e1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000009', 'Nissan',   'Altima',      'DXB-I-90123', 2021),
  ('e1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000010', 'Honda',    'CR-V',        'DXB-J-01234', 2022);

-- ─────────────────────────────────────────
-- JOBS (8 jobs: mix of states)
-- created_at offset to simulate time passage
-- ─────────────────────────────────────────
insert into jobs (id, job_number, customer_id, vehicle_id, mechanic_id, status, description, created_at, completed_at, elapsed_time_seconds) values
  -- PAID jobs (yesterday)
  ('f1000000-0000-0000-0000-000000000001', 'JOB-0001',
    'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
    'complete', 'Regular oil change and filter replacement',
    now() - interval '1 day 4 hours', now() - interval '1 day 2 hours', 7200),

  ('f1000000-0000-0000-0000-000000000002', 'JOB-0002',
    'd1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002',
    'complete', 'Battery not starting – replacement needed',
    now() - interval '1 day 3 hours', now() - interval '1 day 1 hour 30 minutes', 5400),

  ('f1000000-0000-0000-0000-000000000003', 'JOB-0003',
    'd1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003',
    'complete', 'Brake pads worn – front and rear replacement',
    now() - interval '1 day 2 hours', now() - interval '23 hours', 3600),

  -- TODAY completed & paid
  ('f1000000-0000-0000-0000-000000000004', 'JOB-0004',
    'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004',
    'complete', 'Full service package – oil, filter, plugs',
    now() - interval '3 hours', now() - interval '1 hour 15 minutes', 6300),

  ('f1000000-0000-0000-0000-000000000005', 'JOB-0005',
    'd1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001',
    'complete', 'AC not cooling properly – recharge and check',
    now() - interval '2 hours 30 minutes', now() - interval '45 minutes', 6300),

  -- TODAY completed but NOT paid (pending invoice)
  ('f1000000-0000-0000-0000-000000000006', 'JOB-0006',
    'd1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000005',
    'complete', 'Wheel alignment and tire rotation',
    now() - interval '2 hours', now() - interval '30 minutes', 5400),

  -- OPEN jobs (currently being worked on)
  ('f1000000-0000-0000-0000-000000000007', 'JOB-0007',
    'd1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000006',
    'open', 'Check engine light on – diagnostic scan needed',
    now() - interval '1 hour 20 minutes', null, null),

  ('f1000000-0000-0000-0000-000000000008', 'JOB-0008',
    'd1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000002',
    'open', 'Strange noise from engine – suspension inspection',
    now() - interval '45 minutes', null, null);

-- ─────────────────────────────────────────
-- JOB SERVICES
-- ─────────────────────────────────────────
insert into job_services (job_id, service_id, service_name, service_cost) values
  -- JOB-0001: Oil Change
  ('f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Oil Change', 120.00),
  -- JOB-0002: Battery Replacement
  ('f1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Battery Replacement', 350.00),
  -- JOB-0003: Brake Pad Replacement (x2: front + rear)
  ('f1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'Brake Pad Replacement', 450.00),
  -- JOB-0004: Full Service Package
  ('f1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000009', 'Full Service Package', 750.00),
  -- JOB-0005: AC Service
  ('f1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000007', 'AC Service & Recharge', 250.00),
  -- JOB-0006: Wheel Alignment + Tire Rotation
  ('f1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000008', 'Wheel Alignment', 100.00),
  ('f1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000003', 'Tire Rotation', 80.00);

-- ─────────────────────────────────────────
-- JOB PARTS
-- ─────────────────────────────────────────
insert into job_parts (job_id, part_id, part_name, part_cost, quantity) values
  -- JOB-0001
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Engine Oil 5W-30 (5L)', 85.00, 1),
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Oil Filter', 35.00, 1),
  -- JOB-0002
  ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000007', 'Car Battery 70Ah', 280.00, 1),
  -- JOB-0003
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'Brake Pads (Front Set)', 180.00, 1),
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000006', 'Brake Pads (Rear Set)', 160.00, 1),
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000013', 'Brake Fluid DOT4', 20.00, 1),
  -- JOB-0004
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Engine Oil 5W-30 (5L)', 85.00, 1),
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'Oil Filter', 35.00, 1),
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'Air Filter', 60.00, 1),
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000008', 'Spark Plugs (Set of 4)', 120.00, 1),
  -- JOB-0005
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000010', 'Coolant Antifreeze (1L)', 25.00, 2);
  -- JOB-0006 has no parts

-- ─────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────
insert into invoices (invoice_number, job_id, customer_phone, customer_email, service_total, parts_total, total_amount, status, sent_via, paid_at, payment_method) values
  -- INV-0001: JOB-0001 → PAID
  ('INV-0001', 'f1000000-0000-0000-0000-000000000001',
    '+971501234567', 'ahmed.rashid@gmail.com',
    120.00, 120.00, 240.00, 'paid', 'sms,email',
    now() - interval '1 day 1 hour 30 minutes', 'cash'),

  -- INV-0002: JOB-0002 → PAID
  ('INV-0002', 'f1000000-0000-0000-0000-000000000002',
    '+971563456789', 'khalid.ibrahim@yahoo.com',
    350.00, 280.00, 630.00, 'paid', 'sms,email',
    now() - interval '1 day 1 hour', 'card'),

  -- INV-0003: JOB-0003 → PAID
  ('INV-0003', 'f1000000-0000-0000-0000-000000000003',
    '+971505678901', 'omar.abd@outlook.com',
    450.00, 360.00, 810.00, 'paid', 'sms,email',
    now() - interval '22 hours', 'cash'),

  -- INV-0004: JOB-0004 → PAID (today)
  ('INV-0004', 'f1000000-0000-0000-0000-000000000004',
    '+971552345678', 'sara.m@hotmail.com',
    750.00, 300.00, 1050.00, 'paid', 'sms,email',
    now() - interval '1 hour', 'card'),

  -- INV-0005: JOB-0005 → PAID (today)
  ('INV-0005', 'f1000000-0000-0000-0000-000000000005',
    '+971556789012', 'layla.n@gmail.com',
    250.00, 50.00, 300.00, 'paid', 'sms',
    now() - interval '30 minutes', 'cash'),

  -- INV-0006: JOB-0006 → SENT (pending payment)
  ('INV-0006', 'f1000000-0000-0000-0000-000000000006',
    '+971567890123', 'zayed.falasi@gmail.com',
    180.00, 0.00, 180.00, 'sent', 'sms,email',
    null, null);

-- ─────────────────────────────────────────
-- QUOTATIONS (3 sample quotes)
-- ─────────────────────────────────────────
insert into quotations (id, quote_number, customer_name, customer_phone, vehicle_info,
  status, valid_days, valid_until, subtotal, vat_amount, total_amount, created_by, notes)
values
  ('q1000000-0000-0000-0000-000000000001',
   'QUO-0001',
   'Ahmed Al-Rashid', '+971501234567',
   '2021 Toyota Camry – DXB-A-12345',
   'accepted', 7,
   (now() + interval '4 days')::date,
   850.00, 42.50, 892.50,
   'Mariam Al-Zaabi',
   'Customer approved via phone. Job to be booked Monday.'),

  ('q1000000-0000-0000-0000-000000000002',
   'QUO-0002',
   'Khalid Ibrahim', '+971563456789',
   '2022 Nissan Patrol – DXB-C-34567',
   'sent', 30,
   (now() + interval '22 days')::date,
   1480.00, 74.00, 1554.00,
   'Mariam Al-Zaabi',
   'Full suspension overhaul estimate. Awaiting customer confirmation.'),

  ('q1000000-0000-0000-0000-000000000003',
   'QUO-0003',
   'Fatima Hassan', '+971584567890',
   '2023 Toyota Land Cruiser – DXB-D-45678',
   'expired', 7,
   (now() - interval '3 days')::date,
   305.00, 15.25, 320.25,
   'Mariam Al-Zaabi',
   'Customer requested diagnostic and filter quote. No response received.');

-- ─────────────────────────────────────────
-- QUOTATION ITEMS
-- ─────────────────────────────────────────
insert into quotation_items (quotation_id, item_type, item_name, unit_cost, quantity)
values
  -- QUO-0001: Full Service Package + Oil + Oil Filter
  ('q1000000-0000-0000-0000-000000000001', 'service', 'Full Service Package',   750.00, 1),
  ('q1000000-0000-0000-0000-000000000001', 'part',    'Engine Oil 5W-30 (5L)',   85.00, 1),
  ('q1000000-0000-0000-0000-000000000001', 'part',    'Oil Filter',              35.00, 1),

  -- QUO-0002: Suspension + Transmission + Wheel Alignment + parts
  ('q1000000-0000-0000-0000-000000000002', 'service', 'Suspension Inspection',  150.00, 1),
  ('q1000000-0000-0000-0000-000000000002', 'service', 'Wheel Alignment',        100.00, 1),
  ('q1000000-0000-0000-0000-000000000002', 'service', 'Transmission Service',   500.00, 1),
  ('q1000000-0000-0000-0000-000000000002', 'part',    'Serpentine Belt',         95.00, 1),
  ('q1000000-0000-0000-0000-000000000002', 'part',    'Timing Belt',            250.00, 1),
  ('q1000000-0000-0000-0000-000000000002', 'part',    'Thermostat',              85.00, 1),
  ('q1000000-0000-0000-0000-000000000002', 'part',    'Water Pump',             220.00, 1),
  ('q1000000-0000-0000-0000-000000000002', 'part',    'Brake Fluid DOT4',        20.00, 2),

  -- QUO-0003: Engine Diagnostic + Air Filter + Fuel Filter
  ('q1000000-0000-0000-0000-000000000003', 'service', 'Engine Diagnostic Scan', 200.00, 1),
  ('q1000000-0000-0000-0000-000000000003', 'part',    'Air Filter',              60.00, 1),
  ('q1000000-0000-0000-0000-000000000003', 'part',    'Fuel Filter',             45.00, 1);

-- ============================================================
-- GARAGE ERP - DATABASE SCHEMA
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────
create table if not exists customers (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  phone       text not null,
  email       text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- VEHICLES
-- ─────────────────────────────────────────
create table if not exists vehicles (
  id            uuid default uuid_generate_v4() primary key,
  customer_id   uuid references customers(id) on delete cascade,
  make          text not null,
  model         text not null,
  license_plate text not null,
  year          integer,
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────
-- MECHANICS
-- ─────────────────────────────────────────
create table if not exists mechanics (
  id         uuid default uuid_generate_v4() primary key,
  name       text not null,
  phone      text,
  email      text,
  status     text default 'active' check (status in ('active','inactive')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- SERVICES (catalogue)
-- ─────────────────────────────────────────
create table if not exists services (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  cost        numeric(10,2) not null,
  description text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- PARTS (catalogue)
-- ─────────────────────────────────────────
create table if not exists parts (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  cost        numeric(10,2) not null,
  unit        text default 'piece',
  stock_level integer default 0,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────
create table if not exists jobs (
  id                   uuid default uuid_generate_v4() primary key,
  job_number           text unique not null,
  customer_id          uuid references customers(id),
  vehicle_id           uuid references vehicles(id),
  mechanic_id          uuid references mechanics(id),
  status               text default 'open' check (status in ('open','complete')),
  description          text,
  created_at           timestamptz default now(),
  completed_at         timestamptz,
  elapsed_time_seconds integer
);

-- ─────────────────────────────────────────
-- JOB SERVICES (line items)
-- ─────────────────────────────────────────
create table if not exists job_services (
  id           uuid default uuid_generate_v4() primary key,
  job_id       uuid references jobs(id) on delete cascade,
  service_id   uuid references services(id),
  service_name text not null,
  service_cost numeric(10,2) not null
);

-- ─────────────────────────────────────────
-- JOB PARTS (line items)
-- ─────────────────────────────────────────
create table if not exists job_parts (
  id        uuid default uuid_generate_v4() primary key,
  job_id    uuid references jobs(id) on delete cascade,
  part_id   uuid references parts(id),
  part_name text not null,
  part_cost numeric(10,2) not null,
  quantity  integer default 1
);

-- ─────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────
create table if not exists invoices (
  id             uuid default uuid_generate_v4() primary key,
  invoice_number text unique not null,
  job_id         uuid references jobs(id),
  customer_phone text,
  customer_email text,
  service_total  numeric(10,2) default 0,
  parts_total    numeric(10,2) default 0,
  total_amount   numeric(10,2) default 0,
  status         text default 'sent' check (status in ('sent','paid')),
  sent_at        timestamptz default now(),
  sent_via       text default 'sms,email',
  paid_at        timestamptz,
  payment_method text,
  notes          text,
  created_at     timestamptz default now()
);

-- ─────────────────────────────────────────
-- HELPER: atomic job number generator
-- ─────────────────────────────────────────
create or replace function next_job_number()
returns text language plpgsql as $$
declare
  n integer;
begin
  select coalesce(max(cast(substring(job_number from 5) as integer)), 0) + 1
    into n from jobs;
  return 'JOB-' || lpad(n::text, 4, '0');
end;
$$;

-- ─────────────────────────────────────────
-- HELPER: atomic invoice number generator
-- ─────────────────────────────────────────
create or replace function next_invoice_number()
returns text language plpgsql as $$
declare
  n integer;
begin
  select coalesce(max(cast(substring(invoice_number from 5) as integer)), 0) + 1
    into n from invoices;
  return 'INV-' || lpad(n::text, 4, '0');
end;
$$;

-- ─────────────────────────────────────────
-- DISABLE RLS (demo – no auth required)
-- ─────────────────────────────────────────
alter table customers    disable row level security;
alter table vehicles     disable row level security;
alter table mechanics    disable row level security;
alter table services     disable row level security;
alter table parts        disable row level security;
alter table jobs         disable row level security;
alter table job_services disable row level security;
alter table job_parts    disable row level security;
alter table invoices     disable row level security;

-- ─────────────────────────────────────────
-- STOCK MOVEMENTS (inventory audit log)
-- ─────────────────────────────────────────
create table if not exists stock_movements (
  id            uuid default uuid_generate_v4() primary key,
  part_id       uuid references parts(id) on delete cascade,
  change_amount integer not null,
  reason        text not null,
  notes         text,
  created_by    text not null default 'system',
  job_id        uuid references jobs(id) on delete set null,
  created_at    timestamptz default now()
);

alter table stock_movements disable row level security;

-- ─────────────────────────────────────────
-- QUOTATIONS
-- ─────────────────────────────────────────
create table if not exists quotations (
  id             uuid default uuid_generate_v4() primary key,
  quote_number   text unique not null,
  customer_name  text not null,
  customer_phone text not null,
  vehicle_info   text not null,
  status         text default 'draft'
                   check (status in ('draft','sent','accepted','expired')),
  valid_days     integer default 7,
  valid_until    date not null,
  notes          text,
  subtotal       numeric(10,2) default 0,
  vat_amount     numeric(10,2) default 0,
  total_amount   numeric(10,2) default 0,
  created_by     text not null default 'system',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────
-- QUOTATION ITEMS (line items)
-- ─────────────────────────────────────────
create table if not exists quotation_items (
  id           uuid default uuid_generate_v4() primary key,
  quotation_id uuid references quotations(id) on delete cascade,
  item_type    text not null check (item_type in ('service','part')),
  item_name    text not null,
  unit_cost    numeric(10,2) not null,
  quantity     integer not null default 1,
  line_total   numeric(10,2) generated always as (unit_cost * quantity) stored
);

alter table quotations      disable row level security;
alter table quotation_items disable row level security;

-- ─────────────────────────────────────────
-- HELPER: atomic quote number generator
-- ─────────────────────────────────────────
create or replace function next_quote_number()
returns text language plpgsql as $$
declare
  n integer;
begin
  select coalesce(max(cast(substring(quote_number from 5) as integer)), 0) + 1
    into n from quotations;
  return 'QUO-' || lpad(n::text, 4, '0');
end;
$$;

-- ─────────────────────────────────────────
-- HELPER: safe stock decrement (floors at 0)
-- ─────────────────────────────────────────
create or replace function decrement_part_stock(p_part_id uuid, p_qty integer)
returns void language plpgsql as $$
begin
  update parts
     set stock_level = greatest(0, stock_level - p_qty)
   where id = p_part_id;
end;
$$;

-- ─────────────────────────────────────────
-- UAE E-INVOICING: Mandatory fields migration
-- Run this after the initial schema to add compliance columns
-- ─────────────────────────────────────────

-- invoices: UAE eInvoicing mandatory header fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type_code TEXT DEFAULT '380';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'AED';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS accounting_currency TEXT DEFAULT 'AED';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;

-- invoices: transaction type flags
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_free_trade_zone BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_deemed_supply BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_margin_scheme BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_e_commerce BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_export BOOLEAN DEFAULT FALSE;

-- invoices: document totals breakdown
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_total NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_with_tax NUMERIC(10,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payable_amount NUMERIC(10,2);

-- invoices: buyer compliance fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_is_business BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_legal_id_type TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_legal_id_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_street TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_city TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_country TEXT DEFAULT 'AE';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_postal_code TEXT;

-- job_services: per-line VAT fields
ALTER TABLE job_services ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE job_services ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE job_services ADD COLUMN IF NOT EXISTS line_total NUMERIC(10,2);
ALTER TABLE job_services ADD COLUMN IF NOT EXISTS unit_code TEXT DEFAULT 'HUR';

-- job_parts: per-line VAT fields
ALTER TABLE job_parts ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE job_parts ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE job_parts ADD COLUMN IF NOT EXISTS line_total NUMERIC(10,2);
ALTER TABLE job_parts ADD COLUMN IF NOT EXISTS unit_code TEXT DEFAULT 'EA';

-- quotations: customer email for sending quotes
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_email TEXT;

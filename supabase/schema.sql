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

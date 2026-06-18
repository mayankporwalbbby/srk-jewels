-- ============================================================
-- SRK Jewellers - Supabase Database Schema
-- Run this in Supabase > SQL Editor
-- ============================================================

-- Products / Inventory
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  sku_id text,
  product_type text,
  material text,
  from_vendor text,
  quantity int default 1,
  weight_gm numeric,
  quality numeric,
  fine numeric,
  date_of_buying date,
  metal_rate_buying numeric,
  buying_rate_per_gram numeric,
  product_cost numeric,
  image_url text,
  remarks text
);

-- Sales Ledger
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  invoice_id text,
  date date,
  customer_name text,
  address text,
  contact text,
  ref1 text,
  ref1_contact text,
  ref2 text,
  ref2_contact text,
  product_bought text,
  product_details text,
  product_metal text,
  product_weight numeric,
  product_quality numeric,
  fine_metal numeric,
  product_stamp text,
  metal_rate_on_day numeric,
  metal_rate_per_gram numeric,
  amount_without_gst numeric,
  final_price_after_discount numeric,
  hsn_code text,
  gst_pct numeric default 0.03,
  gst_amount numeric,
  final_price_with_gst numeric,
  amount_paid numeric,
  pending_amount numeric,
  bought_from text,
  product_amount numeric,
  revenue numeric,
  return_commitment text,
  remark text,
  image_front text,
  image_back text,
  image_side text,
  image_stamp text
);

-- Loan Ledger
create table if not exists loan_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  book_number text,
  loan_id text,
  name text,
  co text,
  contact text,
  address text,
  aadhar text,
  ref1 text,
  ref1_contact text,
  ref2 text,
  ref2_contact text,
  date_lended date,
  metal_rate_per_gram numeric,
  product_lended text,
  product_metal text,
  product_weight_gm numeric,
  product_quality numeric,
  srk_quality_consideration numeric,
  final_product_weight numeric,
  loan_amount numeric,
  interest_rate numeric default 2.5,
  partner text,
  date_keeping date,
  kept_amount numeric,
  srk_interest numeric,
  amount_submitted numeric,
  date_submission date,
  loan_cleared_date date,
  remark text,
  image_front text,
  image_back text,
  image_side text,
  image_stamp text
);

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  contact text,
  alt_contact text,
  email text,
  address text,
  aadhar text,
  ref1 text,
  ref1_contact text,
  ref2 text,
  ref2_contact text
);

-- ============================================================
-- Row Level Security (RLS) - only logged-in users can access
-- ============================================================
alter table products enable row level security;
alter table sales enable row level security;
alter table loan_entries enable row level security;
alter table customers enable row level security;

create policy "Authenticated users full access" on products for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on sales for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on loan_entries for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on customers for all using (auth.role() = 'authenticated');

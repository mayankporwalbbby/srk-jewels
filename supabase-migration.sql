-- Run this in Supabase SQL Editor to add new columns

-- Products: extra images
alter table products add column if not exists image_url_2 text;
alter table products add column if not exists image_url_3 text;
alter table products add column if not exists image_url_4 text;
alter table products add column if not exists image_url_5 text;

-- Sales: new fields
alter table sales add column if not exists discount numeric default 0;
alter table sales add column if not exists payment_commitment text;
alter table sales add column if not exists executive text;

-- Loan: monthly interest tracking
alter table loan_entries add column if not exists monthly_interest numeric;

-- Loan & Sales: gold rate at time of transaction (for P&L tracking)
alter table loan_entries add column if not exists gold_rate_at_lending numeric;
alter table sales add column if not exists gold_rate_at_sale numeric;

-- Sales: 5 image slots (replacing image_front/image_back)
alter table sales add column if not exists image_url text;
alter table sales add column if not exists image_url_2 text;
alter table sales add column if not exists image_url_3 text;
alter table sales add column if not exists image_url_4 text;
alter table sales add column if not exists image_url_5 text;

-- Payment history tables (for tracking partial payments per sale/loan)
create table if not exists sale_payments (
  id uuid default gen_random_uuid() primary key,
  sale_id uuid references sales(id) on delete cascade,
  amount numeric not null,
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);
alter table sale_payments enable row level security;
create policy if not exists "auth users" on sale_payments for all using (auth.role() = 'authenticated');

create table if not exists loan_payments (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references loan_entries(id) on delete cascade,
  amount numeric not null,
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);
alter table loan_payments enable row level security;
create policy if not exists "auth users" on loan_payments for all using (auth.role() = 'authenticated');

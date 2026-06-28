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

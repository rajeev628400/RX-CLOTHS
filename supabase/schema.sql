create table if not exists public.rx_orders (
  provider_order_id text primary key,
  gateway text not null check (gateway in ('cashfree', 'razorpay')),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
  currency text not null default 'INR' check (currency = 'INR'),
  subtotal_paise integer not null check (subtotal_paise > 0),
  shipping_paise integer not null check (shipping_paise >= 0),
  total_paise integer not null check (total_paise = subtotal_paise + shipping_paise),
  customer_details jsonb not null,
  items jsonb not null,
  provider_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rx_orders enable row level security;
revoke all on table public.rx_orders from anon, authenticated;
grant all on table public.rx_orders to service_role;

-- ============================================================
-- Kawa Phase 4 Schema Updates
-- Supports Customer direct nearest booking with time slots,
-- Kabadiwala planned route & waste ledger, and Officer waste oversight.
-- ============================================================

-- 1. Bookings updates
alter table bookings add column if not exists time_slot text;
alter table bookings add column if not exists scheduled_date date default current_date;
alter table bookings add column if not exists pickup_address text;
alter table bookings add column if not exists pickup_lat double precision;
alter table bookings add column if not exists pickup_lng double precision;
alter table bookings add column if not exists items jsonb default '[]'::jsonb;
alter table bookings add column if not exists notes text;

-- Allow listing_id to be nullable for direct customer-to-kabadiwala bookings
alter table bookings alter column listing_id drop not null;

-- Update RLS for bookings so customers can insert when booking a kabadiwala directly
drop policy if exists "bookings_insert_kabadiwala" on bookings;
drop policy if exists "bookings_insert_participant" on bookings;

create policy "bookings_insert_participant"
  on bookings for insert
  to authenticated
  with check (auth.uid() = kabadiwala_id or auth.uid() = customer_id);

-- 2. Transactions updates (Garbage Quality & Ledger)
alter table transactions add column if not exists quality text default 'Grade A (Clean)';
alter table transactions add column if not exists notes text;

-- 3. Profiles updates (Rate card for Kabadiwalas & Gov ID for Officers)
alter table profiles add column if not exists price_rates jsonb default '{"paper": 14, "plastic": 18, "metal": 35, "ewaste": 40, "glass": 5, "other": 10}'::jsonb;
alter table profiles add column if not exists address text;
alter table profiles add column if not exists gov_id_type text;
alter table profiles add column if not exists gov_id_number text;
alter table profiles add column if not exists department text;

-- 4. Function: get_nearby_kabadiwalas with price_rates & review count
create or replace function get_nearby_kabadiwalas(
  lat double precision,
  lng double precision,
  radius_m integer default 15000
)
returns table (
  id uuid,
  name text,
  phone text,
  rating numeric,
  distance_m double precision,
  lat double precision,
  lng double precision,
  price_rates jsonb,
  review_count bigint
)
language sql
stable
as $$
  select
    p.id,
    p.name,
    p.phone,
    coalesce(p.rating, 0) as rating,
    ST_Distance(p.location, ST_MakePoint(lng, lat)::geography) as distance_m,
    ST_Y(p.location::geometry) as lat,
    ST_X(p.location::geometry) as lng,
    coalesce(p.price_rates, '{"paper": 14, "plastic": 18, "metal": 35, "ewaste": 40, "glass": 5, "other": 10}'::jsonb) as price_rates,
    (select count(*) from ratings r where r.kabadiwala_id = p.id) as review_count
  from profiles p
  where p.role = 'kabadiwala'
    and p.location is not null
    and ST_DWithin(p.location, ST_MakePoint(lng, lat)::geography, radius_m)
  order by distance_m asc;
$$;

grant execute on function get_nearby_kabadiwalas(double precision, double precision, integer) to authenticated;

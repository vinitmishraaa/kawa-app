-- ============================================================
-- Kawa (KabadiWala) — Phase 1 + 2 schema
-- Run this in the Supabase SQL editor (hosted) or via
-- `supabase db execute -f supabase/schema.sql` (local).
-- ============================================================

-- PostGIS is required for the geography(point) columns and
-- ST_DWithin / ST_Distance queries used by the nearby-listings screen.
create extension if not exists postgis;

-- ------------------------------------------------------------
-- Profiles (one row per auth.users row, created on signup)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('customer', 'kabadiwala', 'officer')) not null,
  name text,
  phone text,
  language text default 'en',
  photo_url text,
  location geography(point, 4326),
  verified boolean default false, -- auto-true for customer/kabadiwala; officer starts false
  rating numeric default 0,
  push_token text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Officer identity verification (Phase 2, table created now so
-- the schema doesn't need to change later)
-- ------------------------------------------------------------
create table if not exists officer_verifications (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid references profiles(id) on delete cascade,
  document_urls text[],
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Scrap listings — created by customers
-- ------------------------------------------------------------
create table if not exists scrap_listings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id) on delete cascade,
  photos text[],
  category text not null,
  sub_category text,
  quantity numeric,
  unit text default 'kg',
  estimated_price numeric,
  location geography(point, 4326),
  status text check (status in ('available', 'booked', 'collected')) default 'available',
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Bookings — a kabadiwala claiming a listing
-- ------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references scrap_listings(id) on delete cascade,
  customer_id uuid references profiles(id),
  kabadiwala_id uuid references profiles(id),
  status text check (status in ('requested', 'accepted', 'collected', 'completed')) default 'requested',
  price_agreed numeric,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Transactions — immutable ledger, used for BOTH the
-- customer -> kabadiwala leg and the kabadiwala -> officer leg
-- ------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  from_role text,
  to_role text,
  material_category text,
  quantity numeric,
  price numeric,
  photos text[],
  location geography(point, 4326),
  created_at timestamptz default now(),
  status text default 'completed'
);

-- ------------------------------------------------------------
-- Ratings (Phase 2)
-- ------------------------------------------------------------
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  kabadiwala_id uuid references profiles(id),
  customer_id uuid references profiles(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table officer_verifications enable row level security;
alter table scrap_listings enable row level security;
alter table bookings enable row level security;
alter table transactions enable row level security;
alter table ratings enable row level security;

-- ---------------- profiles ----------------
-- Everyone signed in can read basic profile info (needed to show
-- customer/kabadiwala names & ratings on listings and bookings).
create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

-- A user can only insert/update their own profile row.
create policy "profiles_insert_own"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------- officer_verifications ----------------
create policy "officer_verifications_select_own"
  on officer_verifications for select
  to authenticated
  using (auth.uid() = officer_id);

create policy "officer_verifications_insert_own"
  on officer_verifications for insert
  to authenticated
  with check (auth.uid() = officer_id);

-- ---------------- scrap_listings ----------------
-- Customers: full read/write access to their own listings only.
create policy "listings_select_own_customer"
  on scrap_listings for select
  to authenticated
  using (auth.uid() = customer_id);

create policy "listings_insert_own_customer"
  on scrap_listings for insert
  to authenticated
  with check (auth.uid() = customer_id);

create policy "listings_update_own_customer"
  on scrap_listings for update
  to authenticated
  using (auth.uid() = customer_id);

-- Kabadiwalas: can read any listing that is still available (to find
-- and book nearby scrap) and any listing tied to their own bookings.
create policy "listings_select_available_kabadiwala"
  on scrap_listings for select
  to authenticated
  using (
    status = 'available'
    or exists (
      select 1 from bookings b
      where b.listing_id = scrap_listings.id
        and b.kabadiwala_id = auth.uid()
    )
  );

-- Kabadiwalas update a listing's status only through an existing
-- booking they own (booking -> "booked", collection -> "collected").
create policy "listings_update_via_booking_kabadiwala"
  on scrap_listings for update
  to authenticated
  using (
    exists (
      select 1 from bookings b
      where b.listing_id = scrap_listings.id
        and b.kabadiwala_id = auth.uid()
    )
  );

-- ---------------- bookings ----------------
create policy "bookings_select_participant"
  on bookings for select
  to authenticated
  using (auth.uid() = customer_id or auth.uid() = kabadiwala_id);

create policy "bookings_insert_kabadiwala"
  on bookings for insert
  to authenticated
  with check (auth.uid() = kabadiwala_id);

create policy "bookings_update_participant"
  on bookings for update
  to authenticated
  using (auth.uid() = customer_id or auth.uid() = kabadiwala_id);

-- ---------------- transactions ----------------
-- Customers & kabadiwalas can read transactions they were party to.
create policy "transactions_select_participant"
  on transactions for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Officers can read every transaction (collection records screen)
-- but per spec must NEVER write directly — writes only ever happen
-- from the app when a booking is marked collected, authenticated as
-- one of the two participants above. No insert/update policy is
-- defined for the officer role, so direct officer writes are
-- rejected by RLS with no policy to satisfy.
create policy "transactions_select_officer"
  on transactions for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'officer' and p.verified = true
    )
  );

drop policy if exists "transactions_insert_participant" on transactions;

create policy "transactions_insert_customer_kabadiwala"
  on transactions for insert
  to authenticated
  with check (
    from_role = 'customer'
    and to_role = 'kabadiwala'
    and (
      auth.uid() = from_user_id
      or auth.uid() = to_user_id
    )
    and exists (
      select 1
      from bookings b
      where b.customer_id = from_user_id
        and b.kabadiwala_id = to_user_id
        and b.status in ('accepted', 'collected', 'completed')
    )
  );

create policy "transactions_insert_kabadiwala_officer"
  on transactions for insert
  to authenticated
  with check (
    auth.uid() = from_user_id
    and from_role = 'kabadiwala'
    and to_role = 'officer'
    and exists (
      select 1 from profiles p
      where p.id = to_user_id
        and p.role = 'officer'
        and p.verified = true
    )
  );

-- ---------------- ratings ----------------
create policy "ratings_select_all_authenticated"
  on ratings for select
  to authenticated
  using (true);

create policy "ratings_insert_own_customer"
  on ratings for insert
  to authenticated
  with check (auth.uid() = customer_id);

-- ============================================================
-- Storage — bucket for listing photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Public read (the app calls getPublicUrl() and stores that URL
-- directly on the listing row), but uploads are restricted to a
-- path prefixed with the uploader's own user id — see
-- services/queries/listings.ts, which uploads to `${customerId}/...`.
create policy "listing_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'listing-photos');

create policy "listing_photos_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Storage — private officer identity documents
-- ============================================================
insert into storage.buckets (id, name, public)
values ('officer-documents', 'officer-documents', false)
on conflict (id) do nothing;

create policy "officer_documents_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'officer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "officer_documents_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'officer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Nearby kabadiwalas, used for rating/contact discovery
-- ============================================================
create or replace function get_nearby_kabadiwalas(
  lat double precision,
  lng double precision,
  radius_m integer default 10000
)
returns table (
  id uuid,
  name text,
  phone text,
  rating numeric,
  distance_m double precision,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  select
    p.id,
    p.name,
    p.phone,
    p.rating,
    ST_Distance(p.location, ST_MakePoint(lng, lat)::geography) as distance_m,
    ST_Y(p.location::geometry) as lat,
    ST_X(p.location::geometry) as lng
  from profiles p
  where p.role = 'kabadiwala'
    and p.verified = true
    and p.location is not null
    and ST_DWithin(p.location, ST_MakePoint(lng, lat)::geography, radius_m)
  order by distance_m asc;
$$;

-- ============================================================
-- Market price trend aggregate
-- ============================================================
create or replace function get_price_trend(
  material text default null,
  days_back integer default 90
)
returns table (
  date date,
  avg_price numeric,
  total_quantity numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    date(t.created_at) as date,
    avg(t.price)::numeric as avg_price,
    coalesce(sum(t.quantity), 0)::numeric as total_quantity
  from transactions t
  where t.from_role = 'kabadiwala'
    and t.to_role = 'officer'
    and t.created_at >= now() - make_interval(days => greatest(days_back, 1))
    and (material is null or t.material_category = material)
  group by date(t.created_at)
  order by date(t.created_at);
$$;

grant execute on function get_price_trend(text, integer) to authenticated;

-- ============================================================
-- Nearby-listings query, used by services/queries/listings.ts
-- (kept here for reference — the app calls this shape via
-- PostgREST/RPC, see get_nearby_listings below)
-- ============================================================
create or replace function get_nearby_listings(
  lat double precision,
  lng double precision,
  radius_m integer default 10000
)
returns table (
  id uuid,
  customer_id uuid,
  photos text[],
  category text,
  sub_category text,
  quantity numeric,
  unit text,
  estimated_price numeric,
  status text,
  created_at timestamptz,
  distance_m double precision,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  select
    l.id,
    l.customer_id,
    l.photos,
    l.category,
    l.sub_category,
    l.quantity,
    l.unit,
    l.estimated_price,
    l.status,
    l.created_at,
    ST_Distance(l.location, ST_MakePoint(lng, lat)::geography) as distance_m,
    ST_Y(l.location::geometry) as lat,
    ST_X(l.location::geometry) as lng
  from scrap_listings l
  where l.status = 'available'
    and ST_DWithin(l.location, ST_MakePoint(lng, lat)::geography, radius_m)
  order by distance_m asc;
$$;

-- ============================================================
-- Phase 4 Extensions (Customer Direct Booking, Waste Ledger, Officer Oversight)
-- ============================================================
alter table bookings add column if not exists time_slot text;
alter table bookings add column if not exists scheduled_date date default current_date;
alter table bookings add column if not exists pickup_address text;
alter table bookings add column if not exists pickup_lat double precision;
alter table bookings add column if not exists pickup_lng double precision;
alter table bookings add column if not exists items jsonb default '[]'::jsonb;
alter table bookings add column if not exists notes text;
alter table bookings alter column listing_id drop not null;

drop policy if exists "bookings_insert_kabadiwala" on bookings;
drop policy if exists "bookings_insert_participant" on bookings;

create policy "bookings_insert_participant"
  on bookings for insert
  to authenticated
  with check (auth.uid() = kabadiwala_id or auth.uid() = customer_id);

alter table transactions add column if not exists quality text default 'Grade A (Clean)';
alter table transactions add column if not exists notes text;

alter table profiles add column if not exists price_rates jsonb default '{"paper": 14, "plastic": 18, "metal": 35, "ewaste": 40, "glass": 5, "other": 10}'::jsonb;
alter table profiles add column if not exists address text;
alter table profiles add column if not exists gov_id_type text;
alter table profiles add column if not exists gov_id_number text;
alter table profiles add column if not exists department text;


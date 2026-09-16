-- Kawa Phase 2 + 3 incremental migration
-- Run this ONCE after your existing Phase 1 schema is already installed.
-- It is safe to run repeatedly where IF NOT EXISTS / CREATE OR REPLACE are used.

alter table profiles add column if not exists push_token text;

insert into storage.buckets (id, name, public)
values ('officer-documents', 'officer-documents', false)
on conflict (id) do nothing;

drop policy if exists "officer_documents_insert_own_folder" on storage.objects;
create policy "officer_documents_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'officer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "officer_documents_select_own" on storage.objects;
create policy "officer_documents_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'officer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "transactions_insert_participant" on transactions;

create policy "transactions_insert_customer_kabadiwala"
  on transactions for insert
  to authenticated
  with check (
    from_role = 'customer'
    and to_role = 'kabadiwala'
    and (auth.uid() = from_user_id or auth.uid() = to_user_id)
    and exists (
      select 1 from bookings b
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

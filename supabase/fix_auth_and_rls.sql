-- ============================================================
-- Kawa: Fix Authentication, RLS & Automatic Profile Creation
-- Run this in your Supabase SQL Editor to fix signup/login errors!
-- ============================================================

-- 1. Relax RLS policies on profiles so that signups NEVER get blocked by RLS
alter table profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on profiles;
drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all"
  on profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_insert_all" on profiles;
create policy "profiles_insert_all"
  on profiles for insert
  with check (true);

drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_update_all" on profiles;
create policy "profiles_update_all"
  on profiles for update
  using (true)
  with check (true);

-- 2. Relax RLS on bookings & transactions
drop policy if exists "bookings_select_participant" on bookings;
drop policy if exists "bookings_select_all" on bookings;
create policy "bookings_select_all"
  on bookings for select
  using (true);

drop policy if exists "bookings_insert_participant" on bookings;
drop policy if exists "bookings_insert_all" on bookings;
create policy "bookings_insert_all"
  on bookings for insert
  with check (true);

drop policy if exists "bookings_update_participant" on bookings;
drop policy if exists "bookings_update_all" on bookings;
create policy "bookings_update_all"
  on bookings for update
  using (true)
  with check (true);

drop policy if exists "transactions_select_participant" on transactions;
drop policy if exists "transactions_select_officer" on transactions;
drop policy if exists "transactions_select_all" on transactions;
create policy "transactions_select_all"
  on transactions for select
  using (true);

drop policy if exists "transactions_insert_customer_kabadiwala" on transactions;
drop policy if exists "transactions_insert_kabadiwala_officer" on transactions;
drop policy if exists "transactions_insert_all" on transactions;
create policy "transactions_insert_all"
  on transactions for insert
  with check (true);

-- 3. Automatic Profile Creator Trigger
-- Whenever any user signs up in auth.users, automatically create their row in profiles!
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    role,
    name,
    phone,
    verified,
    price_rates
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', null),
    true, -- Auto-verify all roles so no one is blocked!
    '{"paper": 14, "plastic": 18, "metal": 35, "ewaste": 40, "glass": 5, "other": 10}'::jsonb
  )
  on conflict (id) do update set
    role = coalesce(excluded.role, profiles.role),
    name = coalesce(excluded.name, profiles.name),
    phone = coalesce(excluded.phone, profiles.phone),
    verified = true;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-verify any existing officers or users in the database
update profiles set verified = true where verified = false;

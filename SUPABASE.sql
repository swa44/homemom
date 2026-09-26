-- Supabase SQL Editor에서 사용자가 직접 실행하는 홈맘 전용 스키마입니다.
-- 아리모리와 같은 프로젝트를 사용하지만 homemom_* 테이블로 완전히 분리됩니다.

create extension if not exists pgcrypto;

create table if not exists public.homemom_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  quantity numeric not null check (quantity > 0),
  unit text not null default '개' check (unit in ('개', '봉', '팩', '병', '캔', 'g', 'kg', 'ml', 'L')),
  freezer text not null check (freezer in ('main', 'kimchi')),
  section text not null,
  level smallint not null check (level between 1 and 3),
  expires_on date,
  memo text check (memo is null or length(memo) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homemom_items_valid_location check (
    (freezer = 'main' and section in ('left', 'right', 'left_door', 'right_door'))
    or (freezer = 'kimchi' and section in ('body', 'door'))
  )
);

create table if not exists public.homemom_shopping (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists homemom_items_user_location_idx
  on public.homemom_items (user_id, freezer, section, level);

create index if not exists homemom_items_user_name_idx
  on public.homemom_items (user_id, lower(name));

create index if not exists homemom_shopping_user_checked_idx
  on public.homemom_shopping (user_id, checked, created_at);

create or replace function public.homemom_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists homemom_items_set_updated_at on public.homemom_items;
create trigger homemom_items_set_updated_at
before update on public.homemom_items
for each row execute function public.homemom_set_updated_at();

alter table public.homemom_items enable row level security;
alter table public.homemom_shopping enable row level security;

drop policy if exists "homemom_items_select_own" on public.homemom_items;
create policy "homemom_items_select_own"
on public.homemom_items for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "homemom_items_insert_own" on public.homemom_items;
create policy "homemom_items_insert_own"
on public.homemom_items for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "homemom_items_update_own" on public.homemom_items;
create policy "homemom_items_update_own"
on public.homemom_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "homemom_items_delete_own" on public.homemom_items;
create policy "homemom_items_delete_own"
on public.homemom_items for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "homemom_shopping_select_own" on public.homemom_shopping;
create policy "homemom_shopping_select_own"
on public.homemom_shopping for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "homemom_shopping_insert_own" on public.homemom_shopping;
create policy "homemom_shopping_insert_own"
on public.homemom_shopping for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "homemom_shopping_update_own" on public.homemom_shopping;
create policy "homemom_shopping_update_own"
on public.homemom_shopping for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "homemom_shopping_delete_own" on public.homemom_shopping;
create policy "homemom_shopping_delete_own"
on public.homemom_shopping for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.homemom_items to authenticated;
grant select, insert, update, delete on public.homemom_shopping to authenticated;

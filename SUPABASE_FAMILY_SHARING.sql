-- 홈맘 냉동실 가족 공유 기능 마이그레이션
-- Supabase SQL Editor에서 사용자가 직접 전체 실행하세요.
-- 장보기 목록은 개인 데이터로 유지하고 homemom_items만 가족과 공유합니다.

begin;

create extension if not exists pgcrypto;

create or replace function public.homemom_generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
$$;

create table if not exists public.homemom_households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  invite_code text not null unique default public.homemom_generate_invite_code(),
  created_at timestamptz not null default now()
);

create table if not exists public.homemom_household_members (
  household_id uuid not null references public.homemom_households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null default '가족',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  unique (user_id)
);

alter table public.homemom_items
  add column if not exists household_id uuid references public.homemom_households(id) on delete cascade;

create index if not exists homemom_items_household_location_idx
  on public.homemom_items (household_id, freezer, section, level);

create index if not exists homemom_items_household_name_idx
  on public.homemom_items (household_id, lower(name));

create index if not exists homemom_household_members_user_idx
  on public.homemom_household_members (user_id);

create or replace function public.homemom_is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.homemom_household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.homemom_current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from public.homemom_household_members
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.homemom_create_household(requested_name text default '우리 집')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
  clean_name text := coalesce(nullif(trim(requested_name), ''), '우리 집');
  member_name text := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'preferred_username', ''),
    '가족'
  );
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if length(clean_name) > 40 then
    raise exception '우리 집 이름은 40자 이하여야 합니다.';
  end if;

  if exists (select 1 from public.homemom_household_members where user_id = auth.uid()) then
    raise exception '이미 참여 중인 우리 집이 있습니다.';
  end if;

  insert into public.homemom_households (owner_id, name)
  values (auth.uid(), clean_name)
  returning id into new_household_id;

  insert into public.homemom_household_members (household_id, user_id, role, display_name)
  values (new_household_id, auth.uid(), 'owner', member_name);

  return new_household_id;
end;
$$;

create or replace function public.homemom_join_household(requested_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_household_id uuid;
  member_name text := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'preferred_username', ''),
    '가족'
  );
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if exists (select 1 from public.homemom_household_members where user_id = auth.uid()) then
    raise exception '이미 참여 중인 우리 집이 있습니다.';
  end if;

  select id into target_household_id
  from public.homemom_households
  where invite_code = upper(trim(requested_code));

  if target_household_id is null then
    raise exception '초대 코드를 확인해 주세요.';
  end if;

  insert into public.homemom_household_members (household_id, user_id, role, display_name)
  values (target_household_id, auth.uid(), 'member', member_name);

  return target_household_id;
end;
$$;

-- 기존 냉동실 데이터 소유자마다 우리 집을 만들고 기존 데이터를 그대로 이전합니다.
do $$
declare
  owner_record record;
  new_household_id uuid;
  owner_name text;
begin
  for owner_record in
    select distinct items.user_id
    from public.homemom_items as items
    left join public.homemom_household_members as members on members.user_id = items.user_id
    where items.household_id is null
      and members.user_id is null
  loop
    select coalesce(
      nullif(raw_user_meta_data ->> 'full_name', ''),
      nullif(raw_user_meta_data ->> 'name', ''),
      nullif(raw_user_meta_data ->> 'preferred_username', ''),
      '가족'
    )
    into owner_name
    from auth.users
    where id = owner_record.user_id;

    insert into public.homemom_households (owner_id, name)
    values (owner_record.user_id, '우리 집')
    returning id into new_household_id;

    insert into public.homemom_household_members (household_id, user_id, role, display_name)
    values (new_household_id, owner_record.user_id, 'owner', coalesce(owner_name, '가족'));

    update public.homemom_items
    set household_id = new_household_id
    where user_id = owner_record.user_id
      and household_id is null;
  end loop;

  update public.homemom_items as items
  set household_id = members.household_id
  from public.homemom_household_members as members
  where items.household_id is null
    and items.user_id = members.user_id;
end;
$$;

alter table public.homemom_items
  alter column household_id set default public.homemom_current_household_id();

alter table public.homemom_items
  alter column household_id set not null;

alter table public.homemom_households enable row level security;
alter table public.homemom_household_members enable row level security;

drop policy if exists "homemom_households_select_members" on public.homemom_households;
create policy "homemom_households_select_members"
on public.homemom_households for select to authenticated
using (public.homemom_is_household_member(id));

drop policy if exists "homemom_household_members_select_members" on public.homemom_household_members;
create policy "homemom_household_members_select_members"
on public.homemom_household_members for select to authenticated
using (public.homemom_is_household_member(household_id));

drop policy if exists "homemom_items_select_own" on public.homemom_items;
drop policy if exists "homemom_items_insert_own" on public.homemom_items;
drop policy if exists "homemom_items_update_own" on public.homemom_items;
drop policy if exists "homemom_items_delete_own" on public.homemom_items;
drop policy if exists "homemom_items_select_household" on public.homemom_items;
drop policy if exists "homemom_items_insert_household" on public.homemom_items;
drop policy if exists "homemom_items_update_household" on public.homemom_items;
drop policy if exists "homemom_items_delete_household" on public.homemom_items;

create policy "homemom_items_select_household"
on public.homemom_items for select to authenticated
using (public.homemom_is_household_member(household_id));

create policy "homemom_items_insert_household"
on public.homemom_items for insert to authenticated
with check (
  user_id = (select auth.uid())
  and household_id = public.homemom_current_household_id()
);

create policy "homemom_items_update_household"
on public.homemom_items for update to authenticated
using (public.homemom_is_household_member(household_id))
with check (public.homemom_is_household_member(household_id));

create policy "homemom_items_delete_household"
on public.homemom_items for delete to authenticated
using (public.homemom_is_household_member(household_id));

grant select on public.homemom_households to authenticated;
grant select on public.homemom_household_members to authenticated;
grant execute on function public.homemom_is_household_member(uuid) to authenticated;
grant execute on function public.homemom_current_household_id() to authenticated;
grant execute on function public.homemom_create_household(text) to authenticated;
grant execute on function public.homemom_join_household(text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'homemom_items'
    ) then
    alter publication supabase_realtime add table public.homemom_items;
  end if;
end;
$$;

commit;

-- 실행 후 확인용
select
  households.name,
  households.invite_code,
  members.display_name,
  members.role,
  members.user_id
from public.homemom_households as households
join public.homemom_household_members as members on members.household_id = households.id
order by households.created_at, members.joined_at;

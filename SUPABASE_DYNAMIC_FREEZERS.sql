-- 홈맘 다중 냉장고 및 냉장고별 공유 기능 마이그레이션
-- SUPABASE.sql, SUPABASE_FAMILY_SHARING.sql 실행 후 Supabase SQL Editor에서 직접 실행하세요.
-- 기존 냉장고와 김치냉장고 및 모든 품목은 그대로 보존해 새 구조로 이전합니다.

begin;

create or replace function public.homemom_generate_freezer_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
$$;

create or replace function public.homemom_level_label(level_position integer, level_count integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when level_count = 1 then '전체'
    when level_count = 2 and level_position = 1 then '상단'
    when level_count = 2 and level_position = 2 then '하단'
    when level_count = 3 and level_position = 1 then '상단'
    when level_count = 3 and level_position = 2 then '중단'
    when level_count = 3 and level_position = 3 then '하단'
    else level_position::text || '단'
  end;
$$;

create table if not exists public.homemom_freezers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.homemom_households(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  appliance_type text not null check (appliance_type in ('side_by_side', 'standard')),
  share_with_household boolean not null default true,
  invite_code text not null unique default public.homemom_generate_freezer_code(),
  legacy_key text check (legacy_key is null or legacy_key in ('main', 'kimchi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists homemom_freezers_household_legacy_idx
  on public.homemom_freezers (household_id, legacy_key)
  where legacy_key is not null;

create table if not exists public.homemom_freezer_zones (
  id uuid primary key default gen_random_uuid(),
  freezer_id uuid not null references public.homemom_freezers(id) on delete cascade,
  zone_key text not null,
  label text not null,
  zone_type text not null check (zone_type in ('body', 'door')),
  side text not null check (side in ('left', 'right', 'single')),
  position smallint not null check (position > 0),
  unique (freezer_id, zone_key),
  unique (freezer_id, position)
);

create table if not exists public.homemom_freezer_compartments (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.homemom_freezer_zones(id) on delete cascade,
  label text not null,
  position smallint not null check (position > 0),
  unique (zone_id, position)
);

create table if not exists public.homemom_freezer_members (
  freezer_id uuid not null references public.homemom_freezers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  display_name text not null default '가족',
  joined_at timestamptz not null default now(),
  primary key (freezer_id, user_id)
);

create index if not exists homemom_freezer_members_user_idx
  on public.homemom_freezer_members (user_id, freezer_id);

create index if not exists homemom_freezer_zones_freezer_idx
  on public.homemom_freezer_zones (freezer_id, position);

create index if not exists homemom_freezer_compartments_zone_idx
  on public.homemom_freezer_compartments (zone_id, position);

create or replace function public.homemom_can_access_freezer(target_freezer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.homemom_freezer_members
    where freezer_id = target_freezer_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.homemom_is_freezer_owner(target_freezer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.homemom_freezer_members
    where freezer_id = target_freezer_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.homemom_build_freezer_layout(
  target_freezer_id uuid,
  target_type text,
  body_levels integer,
  has_door_storage boolean,
  door_levels integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_zone_id uuid;
  level_number integer;
begin
  if target_type not in ('side_by_side', 'standard') then
    raise exception '냉장고 형태를 확인해 주세요.';
  end if;
  if body_levels not between 1 and 10 then
    raise exception '본체 칸 수는 1개부터 10개까지 설정할 수 있습니다.';
  end if;
  if has_door_storage and door_levels not between 1 and 10 then
    raise exception '문 수납 칸 수는 1개부터 10개까지 설정할 수 있습니다.';
  end if;

  if target_type = 'side_by_side' then
    insert into public.homemom_freezer_zones (freezer_id, zone_key, label, zone_type, side, position)
    values (target_freezer_id, 'left_door', '좌측 문', 'door', 'left', 1)
    returning id into created_zone_id;
    if has_door_storage then
      for level_number in 1..door_levels loop
        insert into public.homemom_freezer_compartments (zone_id, label, position)
        values (created_zone_id, public.homemom_level_label(level_number, door_levels), level_number);
      end loop;
    else
      delete from public.homemom_freezer_zones where id = created_zone_id;
    end if;

    insert into public.homemom_freezer_zones (freezer_id, zone_key, label, zone_type, side, position)
    values (target_freezer_id, 'left', '좌측 본체', 'body', 'left', 2)
    returning id into created_zone_id;
    for level_number in 1..body_levels loop
      insert into public.homemom_freezer_compartments (zone_id, label, position)
      values (created_zone_id, public.homemom_level_label(level_number, body_levels), level_number);
    end loop;

    insert into public.homemom_freezer_zones (freezer_id, zone_key, label, zone_type, side, position)
    values (target_freezer_id, 'right', '우측 본체', 'body', 'right', 3)
    returning id into created_zone_id;
    for level_number in 1..body_levels loop
      insert into public.homemom_freezer_compartments (zone_id, label, position)
      values (created_zone_id, public.homemom_level_label(level_number, body_levels), level_number);
    end loop;

    if has_door_storage then
      insert into public.homemom_freezer_zones (freezer_id, zone_key, label, zone_type, side, position)
      values (target_freezer_id, 'right_door', '우측 문', 'door', 'right', 4)
      returning id into created_zone_id;
      for level_number in 1..door_levels loop
        insert into public.homemom_freezer_compartments (zone_id, label, position)
        values (created_zone_id, public.homemom_level_label(level_number, door_levels), level_number);
      end loop;
    end if;
  else
    insert into public.homemom_freezer_zones (freezer_id, zone_key, label, zone_type, side, position)
    values (target_freezer_id, 'body', '본체', 'body', 'single', 1)
    returning id into created_zone_id;
    for level_number in 1..body_levels loop
      insert into public.homemom_freezer_compartments (zone_id, label, position)
      values (created_zone_id, public.homemom_level_label(level_number, body_levels), level_number);
    end loop;

    if has_door_storage then
      insert into public.homemom_freezer_zones (freezer_id, zone_key, label, zone_type, side, position)
      values (target_freezer_id, 'door', '문', 'door', 'single', 2)
      returning id into created_zone_id;
      for level_number in 1..door_levels loop
        insert into public.homemom_freezer_compartments (zone_id, label, position)
        values (created_zone_id, public.homemom_level_label(level_number, door_levels), level_number);
      end loop;
    end if;
  end if;
end;
$$;

-- 기존 우리 집마다 기존 냉장고와 김치냉장고를 생성합니다.
do $$
declare
  household_record record;
  migrated_freezer_id uuid;
begin
  for household_record in select id, owner_id from public.homemom_households loop
    select freezers.id into migrated_freezer_id
    from public.homemom_freezers
      as freezers
    where freezers.household_id = household_record.id and freezers.legacy_key = 'main';

    if migrated_freezer_id is null then
      insert into public.homemom_freezers (
        household_id, owner_id, name, appliance_type, share_with_household, legacy_key
      ) values (
        household_record.id, household_record.owner_id, '기존 냉장고', 'side_by_side', true, 'main'
      ) returning id into migrated_freezer_id;
      perform public.homemom_build_freezer_layout(migrated_freezer_id, 'side_by_side', 3, true, 3);
    end if;

    insert into public.homemom_freezer_members (freezer_id, user_id, role, display_name)
    select migrated_freezer_id, members.user_id,
      case when members.user_id = household_record.owner_id then 'owner' else 'editor' end,
      members.display_name
    from public.homemom_household_members as members
    where members.household_id = household_record.id
    on conflict (freezer_id, user_id) do nothing;

    select freezers.id into migrated_freezer_id
    from public.homemom_freezers
      as freezers
    where freezers.household_id = household_record.id and freezers.legacy_key = 'kimchi';

    if migrated_freezer_id is null then
      insert into public.homemom_freezers (
        household_id, owner_id, name, appliance_type, share_with_household, legacy_key
      ) values (
        household_record.id, household_record.owner_id, '김치냉장고', 'standard', true, 'kimchi'
      ) returning id into migrated_freezer_id;
      perform public.homemom_build_freezer_layout(migrated_freezer_id, 'standard', 3, true, 3);
    end if;

    insert into public.homemom_freezer_members (freezer_id, user_id, role, display_name)
    select migrated_freezer_id, members.user_id,
      case when members.user_id = household_record.owner_id then 'owner' else 'editor' end,
      members.display_name
    from public.homemom_household_members as members
    where members.household_id = household_record.id
    on conflict (freezer_id, user_id) do nothing;
  end loop;
end;
$$;

alter table public.homemom_items add column if not exists freezer_id uuid references public.homemom_freezers(id) on delete cascade;
alter table public.homemom_items add column if not exists compartment_id uuid references public.homemom_freezer_compartments(id) on delete restrict;

update public.homemom_items as items
set freezer_id = freezers.id,
    compartment_id = compartments.id
from public.homemom_freezers as freezers
join public.homemom_freezer_zones as zones on zones.freezer_id = freezers.id
join public.homemom_freezer_compartments as compartments on compartments.zone_id = zones.id
where items.household_id = freezers.household_id
  and items.freezer = freezers.legacy_key
  and items.section = zones.zone_key
  and items.level = compartments.position
  and items.freezer_id is null;

alter table public.homemom_items drop constraint if exists homemom_items_valid_location;
alter table public.homemom_items alter column freezer drop not null;
alter table public.homemom_items alter column section drop not null;
alter table public.homemom_items alter column level drop not null;
alter table public.homemom_items alter column freezer_id set not null;
alter table public.homemom_items alter column compartment_id set not null;

create index if not exists homemom_items_dynamic_location_idx
  on public.homemom_items (freezer_id, compartment_id);

create or replace function public.homemom_sync_item_location()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_freezer_id uuid;
  target_household_id uuid;
begin
  select zones.freezer_id, freezers.household_id
  into target_freezer_id, target_household_id
  from public.homemom_freezer_compartments as compartments
  join public.homemom_freezer_zones as zones on zones.id = compartments.zone_id
  join public.homemom_freezers as freezers on freezers.id = zones.freezer_id
  where compartments.id = new.compartment_id;

  if target_freezer_id is null then
    raise exception '보관 위치를 확인해 주세요.';
  end if;

  new.freezer_id := target_freezer_id;
  new.household_id := target_household_id;
  return new;
end;
$$;

drop trigger if exists homemom_items_sync_location on public.homemom_items;
create trigger homemom_items_sync_location
before insert or update of compartment_id on public.homemom_items
for each row execute function public.homemom_sync_item_location();

create or replace function public.homemom_create_freezer(
  requested_name text,
  requested_type text,
  requested_body_levels integer,
  requested_has_door boolean,
  requested_door_levels integer,
  requested_share_household boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_household_id uuid := public.homemom_current_household_id();
  new_freezer_id uuid;
  clean_name text := nullif(trim(requested_name), '');
  member_name text := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'preferred_username', ''),
    '가족'
  );
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if current_household_id is null then raise exception '먼저 우리 집을 만들거나 참여해 주세요.'; end if;
  if clean_name is null or length(clean_name) > 40 then raise exception '냉장고 이름을 확인해 주세요.'; end if;

  insert into public.homemom_freezers (
    household_id, owner_id, name, appliance_type, share_with_household
  ) values (
    current_household_id, auth.uid(), clean_name, requested_type, requested_share_household
  ) returning id into new_freezer_id;

  perform public.homemom_build_freezer_layout(
    new_freezer_id,
    requested_type,
    requested_body_levels,
    requested_has_door,
    case when requested_has_door then requested_door_levels else 0 end
  );

  insert into public.homemom_freezer_members (freezer_id, user_id, role, display_name)
  values (new_freezer_id, auth.uid(), 'owner', member_name);

  if requested_share_household then
    insert into public.homemom_freezer_members (freezer_id, user_id, role, display_name)
    select new_freezer_id, members.user_id,
      case when members.user_id = auth.uid() then 'owner' else 'editor' end,
      members.display_name
    from public.homemom_household_members as members
    where members.household_id = current_household_id
    on conflict (freezer_id, user_id) do nothing;
  end if;

  return new_freezer_id;
end;
$$;

create or replace function public.homemom_join_freezer(requested_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_freezer_id uuid;
  member_name text := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'preferred_username', ''),
    '가족'
  );
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  select id into target_freezer_id
  from public.homemom_freezers
  where invite_code = upper(trim(requested_code));
  if target_freezer_id is null then raise exception '초대 코드를 확인해 주세요.'; end if;

  insert into public.homemom_freezer_members (freezer_id, user_id, role, display_name)
  values (target_freezer_id, auth.uid(), 'editor', member_name)
  on conflict (freezer_id, user_id) do nothing;
  return target_freezer_id;
end;
$$;

-- 가족 코드로 새 구성원이 참여하면 가족 공유로 설정된 냉장고도 자동으로 연결합니다.
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
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  if exists (select 1 from public.homemom_household_members where user_id = auth.uid()) then
    raise exception '이미 참여 중인 우리 집이 있습니다.';
  end if;
  select id into target_household_id
  from public.homemom_households
  where invite_code = upper(trim(requested_code));
  if target_household_id is null then raise exception '초대 코드를 확인해 주세요.'; end if;

  insert into public.homemom_household_members (household_id, user_id, role, display_name)
  values (target_household_id, auth.uid(), 'member', member_name);

  insert into public.homemom_freezer_members (freezer_id, user_id, role, display_name)
  select freezers.id, auth.uid(), 'editor', member_name
  from public.homemom_freezers as freezers
  where freezers.household_id = target_household_id
    and freezers.share_with_household
  on conflict (freezer_id, user_id) do nothing;
  return target_household_id;
end;
$$;

alter table public.homemom_freezers enable row level security;
alter table public.homemom_freezer_zones enable row level security;
alter table public.homemom_freezer_compartments enable row level security;
alter table public.homemom_freezer_members enable row level security;

drop policy if exists "homemom_freezers_select_members" on public.homemom_freezers;
drop policy if exists "homemom_freezers_update_owner" on public.homemom_freezers;
drop policy if exists "homemom_freezers_delete_owner" on public.homemom_freezers;
create policy "homemom_freezers_select_members" on public.homemom_freezers
for select to authenticated using (public.homemom_can_access_freezer(id));
create policy "homemom_freezers_update_owner" on public.homemom_freezers
for update to authenticated using (public.homemom_is_freezer_owner(id))
with check (public.homemom_is_freezer_owner(id));
create policy "homemom_freezers_delete_owner" on public.homemom_freezers
for delete to authenticated using (public.homemom_is_freezer_owner(id));

drop policy if exists "homemom_freezer_zones_select_members" on public.homemom_freezer_zones;
create policy "homemom_freezer_zones_select_members" on public.homemom_freezer_zones
for select to authenticated using (public.homemom_can_access_freezer(freezer_id));

drop policy if exists "homemom_freezer_compartments_select_members" on public.homemom_freezer_compartments;
create policy "homemom_freezer_compartments_select_members" on public.homemom_freezer_compartments
for select to authenticated using (
  exists (
    select 1 from public.homemom_freezer_zones as zones
    where zones.id = zone_id and public.homemom_can_access_freezer(zones.freezer_id)
  )
);

drop policy if exists "homemom_freezer_members_select_members" on public.homemom_freezer_members;
create policy "homemom_freezer_members_select_members" on public.homemom_freezer_members
for select to authenticated using (public.homemom_can_access_freezer(freezer_id));

drop policy if exists "homemom_items_select_household" on public.homemom_items;
drop policy if exists "homemom_items_insert_household" on public.homemom_items;
drop policy if exists "homemom_items_update_household" on public.homemom_items;
drop policy if exists "homemom_items_delete_household" on public.homemom_items;
drop policy if exists "homemom_items_select_freezer" on public.homemom_items;
drop policy if exists "homemom_items_insert_freezer" on public.homemom_items;
drop policy if exists "homemom_items_update_freezer" on public.homemom_items;
drop policy if exists "homemom_items_delete_freezer" on public.homemom_items;

create policy "homemom_items_select_freezer" on public.homemom_items
for select to authenticated using (public.homemom_can_access_freezer(freezer_id));
create policy "homemom_items_insert_freezer" on public.homemom_items
for insert to authenticated with check (
  user_id = (select auth.uid()) and public.homemom_can_access_freezer(freezer_id)
);
create policy "homemom_items_update_freezer" on public.homemom_items
for update to authenticated using (public.homemom_can_access_freezer(freezer_id))
with check (public.homemom_can_access_freezer(freezer_id));
create policy "homemom_items_delete_freezer" on public.homemom_items
for delete to authenticated using (public.homemom_can_access_freezer(freezer_id));

grant select, update, delete on public.homemom_freezers to authenticated;
grant select on public.homemom_freezer_zones to authenticated;
grant select on public.homemom_freezer_compartments to authenticated;
grant select on public.homemom_freezer_members to authenticated;
revoke all on function public.homemom_build_freezer_layout(uuid, text, integer, boolean, integer) from public;
revoke all on function public.homemom_create_freezer(text, text, integer, boolean, integer, boolean) from public;
revoke all on function public.homemom_join_freezer(text) from public;
grant execute on function public.homemom_can_access_freezer(uuid) to authenticated;
grant execute on function public.homemom_is_freezer_owner(uuid) to authenticated;
grant execute on function public.homemom_create_freezer(text, text, integer, boolean, integer, boolean) to authenticated;
grant execute on function public.homemom_join_freezer(text) to authenticated;

commit;

-- 실행 결과 확인
select
  freezers.name,
  freezers.appliance_type,
  freezers.invite_code,
  count(distinct zones.id) as 구역수,
  count(compartments.id) as 칸수
from public.homemom_freezers as freezers
join public.homemom_freezer_zones as zones on zones.freezer_id = freezers.id
join public.homemom_freezer_compartments as compartments on compartments.zone_id = zones.id
group by freezers.id
order by freezers.created_at;

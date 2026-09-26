-- 홈맘 초기 냉동실 데이터 113개를 가져오는 SQL입니다.
-- Supabase SQL Editor에서 사용자가 직접 실행하세요.
--
-- 1) 먼저 아래 조회문만 실행해 홈맘에 로그인한 계정의 UUID를 확인합니다.
-- select id, email, raw_user_meta_data ->> 'name' as name, last_sign_in_at
-- from auth.users
-- order by last_sign_in_at desc;
--
-- 2) 아래에 지정된 UUID가 홈맘에 로그인한 계정과 일치하는지 확인합니다.
-- 3) 전체 SQL을 실행합니다.
--
-- 같은 사용자·품목명·위치의 기존 행은 새 수량으로 교체되므로 다시 실행해도 중복되지 않습니다.
-- 모든 단위는 우선 '개'로 저장합니다.
-- 가족 공유 SQL을 이미 실행했다면 해당 사용자의 우리 집 냉동실로 입력됩니다.

begin;

create temporary table homemom_import_target (
  user_id uuid primary key
) on commit drop;

insert into homemom_import_target (user_id)
values ('83d76b7d-ed8f-469f-b072-0371ccf5ff6a');

do $$
begin
  if not exists (
    select 1
    from auth.users
    where id = (select user_id from homemom_import_target)
  ) then
    raise exception '홈맘 로그인 계정의 올바른 사용자 UUID로 교체해 주세요.';
  end if;
end;
$$;

create temporary table homemom_import_items (
  name text not null,
  quantity numeric not null,
  freezer text not null,
  section text not null,
  level smallint not null
) on commit drop;

insert into homemom_import_items (name, quantity, freezer, section, level)
values
  -- 김치냉장고 본체 상단
  ('우육(중)', 3, 'kimchi', 'body', 1),
  ('우육(소)', 6, 'kimchi', 'body', 1),
  ('고구마말랭이', 1, 'kimchi', 'body', 1),
  ('바게트', 2, 'kimchi', 'body', 1),
  ('도넛', 5, 'kimchi', 'body', 1),
  ('단팥빵', 1, 'kimchi', 'body', 1),
  ('양고기', 1, 'kimchi', 'body', 1),
  ('차돌박이', 1, 'kimchi', 'body', 1),
  ('건두부', 1, 'kimchi', 'body', 1),
  ('김밥', 1, 'kimchi', 'body', 1),
  ('샤브용고기', 1, 'kimchi', 'body', 1),
  ('소고기(국거리)', 3, 'kimchi', 'body', 1),
  ('돼지(삼겹)', 2, 'kimchi', 'body', 1),
  ('돼지(목살)', 2, 'kimchi', 'body', 1),
  ('돼지(항정)', 2, 'kimchi', 'body', 1),

  -- 김치냉장고 본체 중간칸
  ('곶감', 1, 'kimchi', 'body', 2),
  ('옥수수', 2, 'kimchi', 'body', 2),
  ('떡갈비', 4, 'kimchi', 'body', 2),
  ('낫또', 6, 'kimchi', 'body', 2),
  ('갈빗살', 1, 'kimchi', 'body', 2),

  -- 김치냉장고 본체 아래칸
  ('옥수수', 2, 'kimchi', 'body', 3),
  ('깨송편', 1, 'kimchi', 'body', 3),
  ('약과', 1, 'kimchi', 'body', 3),
  ('유부', 1, 'kimchi', 'body', 3),
  ('구운치즈', 2, 'kimchi', 'body', 3),
  ('중화면', 1, 'kimchi', 'body', 3),
  ('얼음', 1, 'kimchi', 'body', 3),
  ('삼겹살', 1, 'kimchi', 'body', 3),
  ('갈매기살', 1, 'kimchi', 'body', 3),

  -- 기존 냉장고 왼쪽 문 상단
  ('팥', 1, 'main', 'left_door', 1),
  ('밥', 1, 'main', 'left_door', 1),
  ('호박', 1, 'main', 'left_door', 1),

  -- 기존 냉장고 왼쪽 문 중단
  ('비지', 1, 'main', 'left_door', 2),
  ('파', 1, 'main', 'left_door', 2),
  ('감말랭이', 2, 'main', 'left_door', 2),

  -- 기존 냉장고 왼쪽 문 하단
  ('도토리가루', 1, 'main', 'left_door', 3),
  ('건고추', 1, 'main', 'left_door', 3),
  ('감말랭이', 2, 'main', 'left_door', 3),
  ('밤', 1, 'main', 'left_door', 3),
  ('핫도그', 1, 'main', 'left_door', 3),

  -- 기존 냉장고 오른쪽 문 상단
  ('마늘', 1, 'main', 'right_door', 1),
  ('화분', 1, 'main', 'right_door', 1),
  ('찐밤', 1, 'main', 'right_door', 1),
  ('건새우', 1, 'main', 'right_door', 1),
  ('양송이버섯기둥', 1, 'main', 'right_door', 1),
  ('멸치대가리', 1, 'main', 'right_door', 1),
  ('해바라기씨', 1, 'main', 'right_door', 1),
  ('대추', 1, 'main', 'right_door', 1),
  ('아스파라거스', 1, 'main', 'right_door', 1),
  ('은행', 1, 'main', 'right_door', 1),

  -- 기존 냉장고 오른쪽 문 하단
  ('건여주', 1, 'main', 'right_door', 3),
  ('쥐포', 1, 'main', 'right_door', 3),
  ('호박씨', 1, 'main', 'right_door', 3),
  ('건치자', 1, 'main', 'right_door', 3),
  ('청국장', 1, 'main', 'right_door', 3),
  ('생새우', 1, 'main', 'right_door', 3),
  ('새우대가리', 1, 'main', 'right_door', 3),
  ('황태포', 1, 'main', 'right_door', 3),

  -- 기존 냉장고 본체 왼쪽 상단
  ('파', 2, 'main', 'left', 1),
  ('단호박', 7, 'main', 'left', 1),
  ('깨송편', 4, 'main', 'left', 1),
  ('쑥', 2, 'main', 'left', 1),
  ('감말랭이', 1, 'main', 'left', 1),
  ('취나물', 1, 'main', 'left', 1),
  ('비지', 1, 'main', 'left', 1),
  ('오디', 1, 'main', 'left', 1),
  ('모짜치즈(개봉)', 1, 'main', 'left', 1),
  ('모짜치즈(미개봉)', 1, 'main', 'left', 1),
  ('편아몬드', 1, 'main', 'left', 1),
  ('갑오징어', 1, 'main', 'left', 1),

  -- 기존 냉장고 본체 왼쪽 중단
  ('파', 10, 'main', 'left', 2),
  ('오디', 3, 'main', 'left', 2),
  ('바나나', 3, 'main', 'left', 2),
  ('옥돔', 1, 'main', 'left', 2),
  ('생수', 2, 'main', 'left', 2),
  ('청양고추', 1, 'main', 'left', 2),

  -- 기존 냉장고 본체 왼쪽 하단
  ('파', 5, 'main', 'left', 3),
  ('쑥', 5, 'main', 'left', 3),
  ('멸치', 2, 'main', 'left', 3),
  ('두부', 1, 'main', 'left', 3),
  ('찐빵', 10, 'main', 'left', 3),

  -- 기존 냉장고 본체 오른쪽 상단
  ('새우젓', 1, 'main', 'right', 1),
  ('매생이', 15, 'main', 'right', 1),
  ('멸치', 2, 'main', 'right', 1),
  ('갑오징어', 7, 'main', 'right', 1),
  ('조기', 1, 'main', 'right', 1),
  ('오징어', 3, 'main', 'right', 1),
  ('고등어', 2, 'main', 'right', 1),
  ('굴비', 2, 'main', 'right', 1),
  ('미더덕', 1, 'main', 'right', 1),
  ('황태', 1, 'main', 'right', 1),
  ('목삼겹', 1, 'main', 'right', 1),
  ('맑은탕', 1, 'main', 'right', 1),

  -- 기존 냉장고 본체 오른쪽 중단
  ('쭈꾸미', 9, 'main', 'right', 2),
  ('파', 4, 'main', 'right', 2),
  ('추젓', 2, 'main', 'right', 2),
  ('앞다리살', 1, 'main', 'right', 2),
  ('멸치', 1, 'main', 'right', 2),
  ('바지락살', 1, 'main', 'right', 2),
  ('전복내장', 1, 'main', 'right', 2),

  -- 기존 냉장고 본체 오른쪽 하단
  ('파', 2, 'main', 'right', 3),
  ('멸치', 1, 'main', 'right', 3),
  ('마늘', 1, 'main', 'right', 3),
  ('쑥개떡', 1, 'main', 'right', 3),
  ('건새우(소)', 2, 'main', 'right', 3),
  ('건새우(대)', 1, 'main', 'right', 3),
  ('냉동삼겹살', 1, 'main', 'right', 3),
  ('뒷고기', 1, 'main', 'right', 3),
  ('다시다', 1, 'main', 'right', 3),
  ('멸치조림용(대)', 1, 'main', 'right', 3),
  ('막창', 2, 'main', 'right', 3),
  ('삼겹살', 1, 'main', 'right', 3),
  ('돼지기름', 1, 'main', 'right', 3);

delete from public.homemom_items as existing
using homemom_import_items as incoming,
      homemom_import_target as target
where existing.user_id = target.user_id
  and existing.name = incoming.name
  and existing.freezer = incoming.freezer
  and existing.section = incoming.section
  and existing.level = incoming.level;

insert into public.homemom_items (
  user_id,
  household_id,
  freezer_id,
  compartment_id,
  name,
  quantity,
  unit,
  freezer,
  section,
  level
)
select
  target.user_id,
  members.household_id,
  freezers.id,
  compartments.id,
  incoming.name,
  incoming.quantity,
  '개',
  incoming.freezer,
  incoming.section,
  incoming.level
from homemom_import_items as incoming
cross join homemom_import_target as target
join public.homemom_household_members as members on members.user_id = target.user_id
join public.homemom_freezers as freezers on freezers.household_id = members.household_id and freezers.legacy_key = incoming.freezer
join public.homemom_freezer_zones as zones on zones.freezer_id = freezers.id and zones.zone_key = incoming.section
join public.homemom_freezer_compartments as compartments on compartments.zone_id = zones.id and compartments.position = incoming.level;

-- 위치별 입력 개수 확인
select
  case freezer when 'kimchi' then '김치냉장고' else '기존 냉장고' end as 냉동실,
  section as 구역,
  level as 칸,
  count(*) as 품목수
from public.homemom_items
where user_id = (select user_id from homemom_import_target)
group by freezer, section, level
order by freezer, section, level;

commit;

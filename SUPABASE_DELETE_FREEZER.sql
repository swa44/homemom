-- 기존에 SUPABASE_DYNAMIC_FREEZERS.sql을 실행한 프로젝트에 냉장고 삭제 기능을 추가합니다.
-- Supabase SQL Editor에서 이 파일을 한 번 실행하세요.

create or replace function public.homemom_delete_freezer(requested_freezer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not exists (
    select 1
    from public.homemom_freezers as freezers
    where freezers.id = requested_freezer_id
      and freezers.owner_id = auth.uid()
  ) then
    raise exception '냉장고 소유자만 삭제할 수 있습니다.';
  end if;

  -- 칸의 외래 키 제약에 걸리지 않도록 품목을 먼저 삭제합니다.
  delete from public.homemom_items
  where freezer_id = requested_freezer_id;

  delete from public.homemom_freezers
  where id = requested_freezer_id
    and owner_id = auth.uid();
end;
$$;

revoke all on function public.homemom_delete_freezer(uuid) from public;
grant execute on function public.homemom_delete_freezer(uuid) to authenticated;


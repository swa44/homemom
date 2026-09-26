# 홈맘

두 냉동실의 품목과 정확한 보관 위치를 검색하고 수량을 관리하는 모바일 우선 PWA입니다. 장보기 목록은 냉동실과 별도로 동작합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

기본 주소는 `http://localhost:3000`입니다.

## Supabase 준비

아리모리와 같은 Supabase 프로젝트를 사용하며 홈맘 데이터는 `homemom_*` 테이블로 분리합니다.

1. Supabase SQL Editor에서 [`SUPABASE.sql`](./SUPABASE.sql)을 실행합니다.
2. 냉동실 가족 공유를 위해 [`SUPABASE_FAMILY_SHARING.sql`](./SUPABASE_FAMILY_SHARING.sql)을 이어서 실행합니다.
   - 기존 냉동실 데이터는 현재 소유자의 `우리 집`으로 자동 이전됩니다.
   - 냉동실만 가족 공유되고 장보기 목록은 개인별로 유지됩니다.
3. 냉장고 추가와 냉장고별 공유를 위해 [`SUPABASE_DYNAMIC_FREEZERS.sql`](./SUPABASE_DYNAMIC_FREEZERS.sql)을 이어서 실행합니다.
   - 기존 냉장고와 김치냉장고 및 등록된 품목 위치는 그대로 유지됩니다.
   - 추가 냉장고는 가족 전체 공유 또는 냉장고 코드 공유를 선택할 수 있습니다.
   - 이전 버전의 다중 냉장고 SQL을 이미 실행했다면 [`SUPABASE_DELETE_FREEZER.sql`](./SUPABASE_DELETE_FREEZER.sql)을 한 번 추가로 실행합니다.
4. Authentication의 Kakao Provider가 활성화되어 있는지 확인합니다.
5. Authentication → URL Configuration → Redirect URLs에 다음을 등록합니다.
   - `http://localhost:3000/auth/callback`
   - `https://homemom.vercel.app/auth/callback`
6. Vercel에는 `.env.example`의 두 환경변수를 등록합니다.

SQL과 RLS가 적용되기 전에는 로그인 후 목록 조회·저장이 실패합니다.

## 배포 주소

- 서비스: `https://homemom.vercel.app`
- OAuth 콜백: `https://homemom.vercel.app/auth/callback`

## 검사

```bash
npm run lint
npm run build
```

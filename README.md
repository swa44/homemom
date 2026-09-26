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
2. Authentication의 Kakao Provider가 활성화되어 있는지 확인합니다.
3. Authentication → URL Configuration → Redirect URLs에 다음을 등록합니다.
   - `http://localhost:3000/auth/callback`
   - `https://homemom.vercel.app/auth/callback`
4. Vercel에는 `.env.example`의 두 환경변수를 등록합니다.

SQL과 RLS가 적용되기 전에는 로그인 후 목록 조회·저장이 실패합니다.

## 배포 주소

- 서비스: `https://homemom.vercel.app`
- OAuth 콜백: `https://homemom.vercel.app/auth/callback`

## 검사

```bash
npm run lint
npm run build
```

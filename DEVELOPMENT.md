# 홈맘 로컬 개발 안내

> 아리모리(`../arimori/DEVELOPMENT.md`) 방식을 그대로 따른다.

## 1. 환경변수

`.env.local` (커밋하지 않음), 같은 키를 값 없이 `.env.example`에도 둔다.

```bash
NEXT_PUBLIC_HOMEMOM_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_HOMEMOM_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
# 서버 전용 키가 필요할 때만 추가
# HOMEMOM_SUPABASE_SECRET_KEY=
```

## 2. 같은 와이파이의 모바일 기기에서 접속

개발 서버를 모든 네트워크 인터페이스에 열어 실행한다.

```bash
npm run dev -- --hostname 0.0.0.0
```

터미널의 `Network` 항목에 표시된 주소를 모바일 브라우저에서 연다.

```text
http://192.168.x.x:3000
```

`next.config.ts`의 `allowedDevOrigins`에 `192.168.x.x` 사설망 전체를 허용한다.

```ts
allowedDevOrigins: ["192.168.*.*"]
```

- 장소나 공유기가 바뀌어 IP 뒷자리가 달라져도 설정을 다시 수정할 필요가 없다.
- 설정 파일을 변경했다면 개발 서버를 종료한 뒤 다시 시작한다.
- 이 설정은 개발 서버에만 적용되며 Vercel 배포 환경에는 영향을 주지 않는다.
- 공용 와이파이에서는 같은 네트워크의 다른 기기가 접근할 수 있으므로 테스트가 끝나면 개발 서버를 종료한다.

## 3. 카카오 로그인과 사설망 주소 (홈맘 추가 사항)

홈맘은 모든 화면이 로그인을 요구하므로 폰 테스트에서도 OAuth 리다이렉트가 동작해야 한다.

- Supabase `Authentication → URL Configuration → Redirect URLs`에 다음을 등록한다.
  - `http://localhost:3000/**`
  - `http://192.168.*.*:3000/**` (와일드카드가 허용되지 않으면 현재 IP를 직접 등록)
  - 배포 주소 `https://<project>.vercel.app/**`
- 카카오 개발자 콘솔의 Redirect URI는 Supabase 콜백 주소 하나만 등록하면 된다. 앱으로 돌아오는 주소는 Supabase가 처리한다.
- 사설망 HTTP 주소에서는 Service Worker와 PWA 설치가 동작하지 않는다 (HTTPS 또는 localhost만 허용). PWA 설치 테스트는 Vercel 배포 주소에서 한다.

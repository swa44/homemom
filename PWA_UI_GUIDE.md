# 홈맘 PWA 설치 안내와 모바일 UI 가이드

> 아리모리(`../arimori/PWA_UI_GUIDE.md`)에서 검증한 방식을 홈맘에 맞게 정리한 문서다.
> 아리모리의 10장(일반 앱과 관리자 앱을 서로 다른 PWA로 분리)은 홈맘에 관리자 앱이 없으므로 제외했다.

## 1. 구현 파일 (예정)

- 설치 안내 컴포넌트: `src/components/pwa/PwaInstallPrompt.tsx` (아리모리에서 이식)
- 전역 배치와 Apple 메타데이터: `src/app/layout.tsx`
- Web App Manifest: `src/app/manifest.ts`
- Service Worker: `public/sw.js`
- PWA 아이콘: `public/icons/`
- 설치 안내, 스크롤바, 로딩 오버레이 CSS: `src/app/globals.css`

## 2. 필수 조건

- 배포 환경은 HTTPS여야 한다. 로컬 개발에서는 `localhost`만 허용된다 (`192.168.x.x` HTTP 주소에서는 설치 불가).
- Manifest에 `name`, `short_name`, `start_url`, `scope`, `display: "standalone"`, 테마 색상과 아이콘을 넣는다.
- Android용으로 192px, 512px 아이콘과 `maskable` 아이콘을 제공한다.
- iOS용 180px Apple Touch Icon과 `appleWebApp.capable` 메타데이터를 제공한다.
- Service Worker를 등록해야 설치 조건을 충족한다.

### 홈맘 Manifest 값 (초안)

```ts
{
  id: "/",
  name: "홈맘 — 냉동실 관리",   // 서비스 이름 확정 필요
  short_name: "홈맘",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#faf8f4",  // --paper
  theme_color: "#3d5a80",       // --brand-navy
}
```

- `manifest.webmanifest`와 아이콘 경로는 로그인하지 않은 상태에서도 읽을 수 있어야 한다. `proxy.ts`의 로그인 보호에서 반드시 제외한다. 막으면 로그인 화면에서 Android `beforeinstallprompt`가 발생하지 않는다.
- `proxy.ts`에서 로그인 보호를 제외할 경로: `/login`, `/auth/*`, `/manifest.webmanifest`, `/sw.js`, `/icons/*`, `/logo.png`, `/_next/*`

## 3. Android 설치 안내

Chromium 계열 브라우저는 설치 조건이 충족되면 `beforeinstallprompt` 이벤트를 발생시킨다.

```tsx
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

useEffect(() => {
  function capturePrompt(event: Event) {
    event.preventDefault();
    setInstallPrompt(event as BeforeInstallPromptEvent);
  }

  window.addEventListener("beforeinstallprompt", capturePrompt);
  return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
}, []);

async function install() {
  if (!installPrompt) return;
  await installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  if (outcome === "accepted") dismiss();
  setInstallPrompt(null);
}
```

- 이벤트 객체를 저장해 두고 사용자가 `설치` 버튼을 눌렀을 때만 `prompt()`를 실행한다.
- `appinstalled` 이벤트가 발생하면 안내를 닫는다.
- 설치 조건을 충족하지 못하면 이벤트가 발생하지 않으므로 설치 버튼도 표시하지 않는다.

## 4. iOS 설치 안내

iOS Safari는 `beforeinstallprompt`를 제공하지 않으므로 사용 방법을 안내한다.

```text
공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.
```

```tsx
const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);

const standalone = window.matchMedia("(display-mode: standalone)").matches
  || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
```

- 이미 standalone으로 실행 중이면 안내를 표시하지 않는다.

## 5. 안내 닫기 상태

홈맘은 매일 쓰는 앱이라 세션마다 안내가 뜨면 번거롭다. **`localStorage`에 저장해 오래 숨긴다** (아리모리는 `sessionStorage` 사용).

```tsx
localStorage.setItem("homemom-install-dismissed", String(Date.now()));
```

- 닫은 지 7일이 지나면 다시 안내한다.
- 설정 탭의 `앱 설치 안내 다시 보기`는 이 키를 지운다.
- `localStorage` 접근은 `try/catch`로 감싼다 (사생활 보호 모드 대비).

## 6. 하단 설치 안내 배치

하단 내비게이션, FAB, iPhone 안전영역을 피해서 배치한다.

```css
.install-prompt {
  bottom: calc(var(--nav-height) + 20px + env(safe-area-inset-bottom));
  left: 50%;
  max-width: 550px;
  position: fixed;
  transform: translateX(-50%);
  width: calc(100% - 28px);
  z-index: 1200;
}
```

- 설치 안내가 떠 있는 동안에는 FAB와 겹치지 않도록 FAB를 숨기거나 안내 위로 올린다.
- z-index 기준은 DESIGN.md 7장을 따른다 (설치 안내 1200 < 바텀시트 1300).

## 7. Service Worker 정책 (홈맘 기준)

홈맘의 데이터는 로그인한 사용자 개인 데이터이므로 아리모리보다 캐시를 보수적으로 한다.

| 요청 | 전략 |
|---|---|
| `/_next/static/*`, `/icons/*`, `/logo.png` | 캐시 우선 |
| 페이지 이동(navigate) | 네트워크 우선, 실패 시 오프라인 안내 페이지 |
| Supabase API (`*.supabase.co`) | **캐시하지 않음** (SW가 가로채지 않는다) |
| React Server Component 요청 (`RSC` 헤더, `?_rsc=`) | 캐시하지 않음 |
| `/auth/*`, `/login` | 캐시하지 않음 |

- 캐시 이름은 `homemom-v1`처럼 버전을 붙이고, 정책을 바꾸면 버전을 올려 이전 캐시를 정리한다.
- 로그아웃 시 개인 데이터가 캐시에 남지 않도록 페이지 HTML도 캐시하지 않는다. 오프라인 안내 페이지 하나만 미리 캐시한다.
- 오프라인에서의 수정(동기화 대기열)은 1차 범위에서 제외한다.

## 8. Android·iOS·PC 스크롤바 숨김

스크롤 기능은 유지하고 스크롤바만 숨긴다. `overflow: hidden`은 쓰지 않는다.

```css
.scroll-container {
  -ms-overflow-style: none;
  overflow: auto;
  scrollbar-width: none;
}

.scroll-container::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}
```

바텀시트 적용 예시:

```css
.bottom-sheet {
  -ms-overflow-style: none;
  max-height: 85vh;
  overflow: auto;
  scrollbar-width: none;
}

.bottom-sheet::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}
```

바텀시트가 열리면 배경 스크롤을 잠근다. 홈맘은 `.site-shell`이 스크롤을 담당하므로 `body`가 아니라 `.site-shell`을 잠근다.

```tsx
useEffect(() => {
  const shell = document.querySelector<HTMLElement>(".site-shell");
  if (!shell) return;
  shell.style.overflowY = sheetOpen ? "hidden" : "";
  return () => { shell.style.overflowY = ""; };
}, [sheetOpen]);
```

### Samsung Internet PWA의 스크롤 위치 표시기

Samsung Internet으로 설치한 PWA는 `html`/`body`가 스크롤을 담당하면 네이티브 스크롤 표시기가 남는다. 처음부터 `.site-shell`이 스크롤을 담당하도록 구성한다.

```css
html {
  height: 100%;
  overflow: hidden;
}

body {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.site-shell {
  height: 100vh;  /* 100dvh 미지원 브라우저용 */
  height: 100dvh;
  min-height: 0;
  -ms-overflow-style: none;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.site-shell::-webkit-scrollbar {
  display: none;
  height: 0;
  width: 0;
}
```

페이지가 바뀌면 `.site-shell`의 스크롤 위치를 직접 초기화한다.

```tsx
useEffect(() => {
  document.querySelector<HTMLElement>(".site-shell")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}, [pathname]);
```

- 냉동실·구역 필터 전환은 같은 페이지 안의 상태 변경이므로 스크롤을 초기화하지 않는다. 각 필터의 스크롤 위치를 기억할지는 구현 단계에서 결정한다.

## 9. 하단 내비게이션 이동 반응과 로딩 화면

탭 이동 상태는 `onPointerDown`이 아니라 Next.js `Link`의 `onNavigate`에서 시작한다. 길게 누르기만 했을 때 메뉴와 화면이 어긋나는 문제를 막기 위해서다.

```tsx
<Link
  href={href}
  onNavigate={() => {
    if (!isCurrentPath(href)) setPendingHref(href);
  }}
>
  {label}
</Link>
```

```tsx
{pendingHref && !isCurrentPath(pendingHref) ? (
  <div className="route-loading-overlay" role="status" aria-live="polite">
    <span className="route-loading-spinner" aria-hidden="true" />
    <span className="sr-only">페이지를 불러오는 중입니다.</span>
  </div>
) : null}
```

```css
.route-loading-overlay {
  align-items: center;
  background: var(--paper);
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
  z-index: 900;
}

.route-loading-spinner {
  animation: route-loading-spin 700ms linear infinite;
  border: 3px solid rgba(79, 167, 154, 0.2);  /* --brand-mint 20% */
  border-radius: 50%;
  border-top-color: var(--brand-mint);
  height: 30px;
  width: 30px;
}

@keyframes route-loading-spin {
  to { transform: rotate(360deg); }
}
```

경로가 바뀌면 대기 상태를 해제하고, 안전 해제 시간(10초)을 둔다. 3개 탭은 모두 미리 불러온다.

```tsx
useEffect(() => {
  const resetPending = window.setTimeout(() => setPendingHref(null), 0);
  return () => window.clearTimeout(resetPending);
}, [pathname]);

useEffect(() => {
  if (!pendingHref) return;
  const safetyReset = window.setTimeout(() => setPendingHref(null), 10000);
  return () => window.clearTimeout(safetyReset);
}, [pendingHref]);

useEffect(() => {
  tabs.forEach(({ href }) => router.prefetch(href));
}, [router]);
```

## 10. 재사용 체크리스트 (홈맘 적용)

1. Manifest 이름을 `홈맘`으로, 테마색을 `--brand-navy`로 설정한다.
2. 로고 확정 후 180px, 192px, 512px, maskable 아이콘을 교체한다 (maskable은 안전 여백 확보).
3. Service Worker 캐시 이름은 `homemom-v1`로 하고, Supabase와 개인 데이터 요청은 캐시하지 않는다.
4. 설치 안내 저장 키는 `homemom-install-dismissed`(`localStorage`, 7일)로 한다.
5. Manifest, SW, 아이콘 경로는 `proxy.ts` 로그인 보호에서 제외한다.
6. 설치 안내, FAB, 토스트 위치에 `--nav-height`와 `safe-area-inset-bottom`을 반영한다.
7. iOS에서는 공유 메뉴 안내를 표시한다.
8. standalone 실행 중이면 설치 안내를 숨긴다.
9. 스크롤바를 숨길 때 `overflow: auto`는 유지한다.
10. 처음부터 `.site-shell`이 스크롤을 담당하게 구성한다 (Samsung Internet 대응).
11. 탭 이동 로딩은 `onNavigate`에서 시작한다.
12. Android Chrome, Samsung Internet, iOS Safari, 설치된 PWA 모드에서 각각 확인한다.
13. 카카오 로그인 후 standalone PWA로 돌아오는지 확인한다. iOS PWA에서 OAuth가 Safari로 열려 세션이 PWA에 전달되지 않는 경우가 있으므로 실기기에서 반드시 테스트한다.

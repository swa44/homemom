# 홈맘(homemom) 냉동실 위치·재고 관리 — 디자인 가이드

> 작성일: 2026-09-26
> 참고: 아리모리(`../arimori/DESIGN.md`)의 레이아웃 3원칙, 탭별 컬러 매칭 방식, 아이콘 시스템, Supabase 명명 규칙을 차용한다. 색상과 분위기는 신규로 설계한다.

## 1. 레이아웃 3원칙 (아리모리와 동일)

```css
/* 1. 전체 컨테이너 — PC에서도 모바일 폭 유지 */
body {
  max-width: 600px;
  margin: 0 auto;
}

/* 2. 하단 고정 내비게이션 — 화면 중앙 고정 */
nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  max-width: 600px;
  width: 100%;
  z-index: 1000;
}

/* 3. 메인 콘텐츠 — 하단 내비게이션에 가리지 않게 여백 확보 */
main {
  padding-bottom: calc(var(--nav-height) + 20px);
}
```

- 스크롤은 `html`/`body`가 아니라 `.site-shell`이 담당한다 (PWA_UI_GUIDE.md 8장, Samsung Internet 대응).
- 하단 내비게이션과 FAB, 토스트는 `env(safe-area-inset-bottom)`을 반영한다.

## 2. 브랜드 컬러 (초안 — 확인 필요)

키워드는 **"한눈에 찾는 정돈된 냉동실 + 따뜻한 집밥"**이다. 네이비와 민트를 냉동실·검색에 사용하고, 따뜻한 코랄은 독립 장보기 목록에 사용한다.

```css
:root {
  --brand-mint:  #4fa79a;   /* 검색 · 보조 포인트 */
  --brand-navy:  #3d5a80;   /* 냉동실 · 기본 포인트 */
  --brand-coral: #e07a5f;   /* 장보기 · FAB (따뜻함, 집밥) */

  --status-warn:   #e9a23b; /* 유통기한 D-3 ~ D-1 */
  --status-danger: #d64545; /* 유통기한 당일 · 지남 */

  --paper: #faf8f4;         /* 배경 — 약간 따뜻한 흰색 */
  --card:  #ffffff;
  --line:  #ece8e1;         /* 구분선 */
  --ink:   #1c1c1c;         /* 기본 텍스트, 미선택 아이콘 */
  --ink-sub: #6b6b6b;       /* 보조 텍스트 (단위, 메모) */

  --nav-height: 64px;
}
```

- 로고가 정해지면 로고 색에 맞춰 `--brand-*` 값을 다시 조정한다.
- 경고색과 위험색은 브랜드색과 섞어 쓰지 않는다. 유통기한 뱃지와 배너에만 사용한다.
- 다크 모드는 1차 범위에서 제외한다 (2차 후보).

### 탭 ↔ 컬러 매칭

| 탭 | 아이콘 | 선택 시 색상 변수 |
|---|---|---|
| 냉동실 | `Snowflake` | `--brand-navy` |
| 장보기 | `ShoppingCart` | `--brand-coral` |
| 설정 | `Settings` | `--brand-navy` |

- 미선택: 아이콘과 라벨 모두 `--ink`
- 선택: 매칭 컬러 + 아이콘 `strokeWidth` 2 → 2.5로 굵게 (색상만으로 상태를 구분하지 않는다)

```tsx
const TAB_COLORS: Record<string, string> = {
  freezer: "var(--brand-navy)",
  shopping: "var(--brand-coral)",
  settings: "var(--brand-navy)",
};
```

### 냉동실 선택 컬러

| 냉동실 | 선택 시 배경 | 아이콘 (선택) |
|---|---|---|
| 기존 냉장고 냉동실 | `--brand-navy` | `Snowflake` |
| 김치냉장고 냉동실 | `--brand-mint` | `Snowflake` |

## 3. 아이콘 시스템

- 라이브러리: `lucide-react` (아리모리와 동일, 트리쉐이킹 지원)
- 주요 아이콘

| 용도 | 아이콘 |
|---|---|
| 냉동실 탭 | `Snowflake` |
| 장보기 | `ShoppingCart` |
| 설정 | `Settings` |
| 추가 (FAB) | `Plus` |
| 수량 감소 / 증가 | `Minus` / `Plus` |
| 검색 | `Search` |
| 위치 | `MapPin` |
| 유통기한 입력 | `CalendarDays` |
| 삭제 | `Trash2` |

## 4. 타이포그래피

- 기본 폰트: **Pretendard** (가변 폰트, `next/font/local` 또는 CDN)
- 크기 기준

| 용도 | 크기 / 굵기 |
|---|---|
| 헤더 제목 | 20px / 700 |
| 품목 이름 | 16px / 600 |
| 수량 숫자 | 18px / 700, `font-variant-numeric: tabular-nums` |
| 단위, 메모, 보조 | 13px / 400, `--ink-sub` |
| D-day 뱃지 | 12px / 700 |

- 수량은 tabular-nums로 숫자 폭을 고정해 ± 조작 시 버튼 위치가 흔들리지 않게 한다.

## 5. 분위기

- **깔끔함**: 여백을 넉넉히 두고 장식은 최소화한다. 목록이 주인공이다.
- **친근함**: 둥근 모서리(카드 16px, 버튼 12px)와 부드러운 그림자를 사용한다. 토스트 문구는 "다 썼어요"처럼 말투를 부드럽게 한다.
- **빠른 조작**: 자주 누르는 ± 버튼과 FAB는 최소 44×44px 터치 영역을 확보한다.

## 6. 컴포넌트 스타일

- **품목 행(ItemRow)**
  - 카드형이 아니라 리스트형(구분선 `--line`)으로 한 화면에 많이 보이게 한다.
  - 첫 줄: 품목 이름과 `[−] 수량 단위 [+]`를 표시한다.
  - 둘째 줄: `냉동실 · 구역 · 칸`을 `MapPin` 아이콘과 함께 표시한다.
  - 위치 정보는 검색 결과에서 가장 중요한 보조 정보이므로 메모보다 우선한다.
- **D-day 뱃지(ExpiryBadge)**
  - D-4 이상은 회색 텍스트, D-3~D-1은 `--status-warn` 배경 + 흰 글씨, D-day 이하는 `--status-danger` 배경
  - 표기: `D-5`, `D-day`, `+2일 지남`
- **임박 배너**: `--status-warn` 10% 투명도 배경, 왼쪽에 `AlertTriangle`, 오른쪽에 `>`
- **FAB**: `--brand-coral`, 56px 원형, `bottom: calc(var(--nav-height) + 16px + env(safe-area-inset-bottom))`
- **바텀시트**: 상단 둥근 모서리 20px, 핸들 바, `max-height: 85vh`, 스크롤바 숨김 (PWA_UI_GUIDE.md 8장). 열릴 때 배경 스크롤을 잠근다.
- **토스트**: 저장 실패 같은 오류를 짧게 알릴 때만 사용한다. 수량 0 삭제에는 되돌리기를 표시하지 않는다.
- **검색창**: 홈 상단에 항상 노출하며 검색 결과의 위치 문구를 눈에 띄게 표시한다.
- **위치 필터**: 냉동실과 구역을 가로 스크롤 칩으로 제공하며 선택 상태를 색상과 굵기로 함께 구분한다.
- **빈 상태**: "냉동실이 비어 있어요" 문구와 `+ 첫 품목 추가` 버튼
- **로그인 버튼**: 카카오 디자인 가이드를 따른다 (배경 `#FEE500`, 글자 `#000000` 85%, 카카오 심볼).

## 7. z-index 기준

| 레이어 | z-index |
|---|---|
| 콘텐츠 | auto |
| 탭 이동 로딩 오버레이 | 900 |
| 하단 내비게이션 | 1000 |
| FAB / 토스트 | 1100 |
| PWA 설치 안내 | 1200 |
| 바텀시트 배경 + 시트 | 1300 |

## 8. 반응형 원칙

- 기준 폭 600px 컨테이너 안에서 모든 요소가 반응형으로 동작한다.
- PC에서는 좌우 여백을 두고 모바일 레이아웃을 그대로 보여준다.
- FAB와 토스트도 600px 컨테이너 기준으로 위치를 계산한다 (`left: 50%` + `translateX` 방식 또는 컨테이너 내부 `sticky`).

## 9. Supabase 명명 규칙

- 프로젝트 식별자는 `HOMEMOM_`를 사용한다.
- 공개 환경변수: `NEXT_PUBLIC_HOMEMOM_SUPABASE_URL`, `NEXT_PUBLIC_HOMEMOM_SUPABASE_PUBLISHABLE_KEY`
- 서버 전용 환경변수 (필요할 때만): `HOMEMOM_SUPABASE_SECRET_KEY`
- 테이블: `homemom_items`, `homemom_shopping`
- Postgres에서 매번 큰따옴표를 쓰지 않도록 테이블명은 소문자로 통일한다.

## 10. 로고

- 헤더와 로그인 화면에는 텍스트 대신 `/logo.png` 이미지를 사용한다.
- 로고 확정 전에는 임시 이미지를 `public/logo.png`에 둔다.
- PWA 아이콘(180, 192, 512, maskable)은 로고 확정 후 함께 생성한다.

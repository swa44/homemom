Supabase SQL은 사용자가 직접 입력할 수 있도록 제공한다. 사용자가 분석이나 조언을 요청한 경우 코딩을 시작해 달라고 명시하기 전에는 코드를 수정하지 않는다.

기획은 PLAN.md, 디자인은 DESIGN.md, 로컬 개발은 DEVELOPMENT.md, PWA 구현은 PWA_UI_GUIDE.md를 기준으로 한다.

Next.js 16은 이전 버전과 API, 규칙, 파일 구조가 다를 수 있다. 코드를 작성하기 전에 `node_modules/next/dist/docs/`의 관련 가이드를 확인하고 deprecation 안내를 따른다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

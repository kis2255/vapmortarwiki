# 삼표 특수몰탈 기술 위키

> **삼표 = 자사**. Sika, Fosroc, Weber, Saint-Gobain = 경쟁사.

- Production: https://vapmortarwiki.vercel.app
- GitHub: https://github.com/kis2255/vapmortarwiki

## 기술 스택
Next.js 16 + Tailwind 4 | Supabase PostgreSQL + pgvector | Prisma 6 | Gemini 2.0 Flash (LLM + Embedding 768차원) | Vercel AI SDK | react-markdown + remark-gfm

## 컨벤션
- TypeScript, ESLint, camelCase
- 커밋: 한글 허용, conventional commits
- 카테고리 컬러: 그라우트(에메랄드), 보수(블루), 방수(시안), 바닥(퍼플), 주입(앰버), 타일(오렌지), 시장경쟁사(로즈), 국제규격(인디고)

## 핵심 구조
- `src/lib/rag/` — RAG 파이프라인 (retriever: 다중 ILIKE + pgvector, generator: 의도분류 + Gemini)
- `src/app/api/` — API Routes (chat, search, products, articles, upload)
- `src/app/chat/` — AI 채팅 (ReactMarkdown 답변 렌더링)
- `src/app/wiki/standards/[id]/` — 규격 상세 페이지
- `src/components/layout/sidebar.tsx` — 계층형 사이드바 (제품>그라우트/보수/바닥/타일)

## 데이터 현황
- 제품 15종 (삼표 특수몰탈: SG 그라우트 6, SPPM 보수 1, 바닥 4, 타일 4)
- 규격 13건 (KS 7 + KDS 1 + EN 2 + ASTM 2 + ACI 1 + BS 1)
- 위키 16건, PDF 8건, 카테고리 8개

## 상세 문서
- [docs/architecture.md](docs/architecture.md) — 시스템 아키텍처, RAG/PDF 파이프라인, 디렉토리 구조
- [docs/database.md](docs/database.md) — DB 스키마, 제품/규격/위키 현황, 엔티티 관계
- [docs/api.md](docs/api.md) — 22개 라우트 명세, 페이지 맵
- [docs/changelog.md](docs/changelog.md) — 진행 이력 (Phase 1~15)

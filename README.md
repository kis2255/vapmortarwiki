# 삼표 특수몰탈 기술 위키

삼표그룹 특수몰탈 마케팅 부서의 기술자료를 체계적으로 DB화하고, Wikipedia 형태의 내부 기술 위키로 제공하는 시스템.

## 주요 기능

- **제품 DB** — 삼표 특수몰탈 15종 (그라우트 SG 시리즈, 보수몰탈 SPPM, 바닥몰탈 SFM/SPSL, 타일용 ST)
- **AI 질의응답** — 자연어 질문 → RAG 기반 AI 답변 (Gemini 2.0 Flash)
- **위키 문서** — 기술 해설, 시장 동향, 경쟁사 분석 (Markdown)
- **규격/표준** — KS/KDS/EN/ASTM/ACI/BS 13건 (상세 해설 페이지)
- **PDF 관리** — 업로드 → 자동분류 → 임베딩 → AI 검색 연동
- **통합 검색** — 제품/위키/PDF/규격 실시간 검색

## 기술 스택

Next.js 16 · Tailwind CSS 4 · Supabase PostgreSQL + pgvector · Prisma 6 · Google Gemini 2.0 Flash · Vercel

## 시작하기

```bash
npm install
npm run dev          # http://localhost:3000
```

## 환경 변수

```bash
DATABASE_URL=          # Supabase pooler
DIRECT_URL=            # Supabase direct
GOOGLE_GENERATIVE_AI_API_KEY=   # Vercel AI SDK
GOOGLE_GEMINI_API_KEY=          # Embedding API
```

## 문서

- [시스템 아키텍처](docs/architecture.md)
- [데이터베이스](docs/database.md)
- [API 명세](docs/api.md)
- [사용 가이드](docs/user-guide.md)
- [변경 이력](docs/changelog.md)

## 배포

- **Production**: https://vapmortarwiki.vercel.app
- `git push origin master` → Vercel 자동 배포

# 시스템 아키텍처

## 전체 구조
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  사용자 브라우저  │────▶│  Vercel Edge   │────▶│  Supabase PG    │
│  (Next.js)    │     │  (API Routes)  │     │  + pgvector     │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐
                    │  Google Gemini │
                    │  (LLM + Embed) │
                    └──────────────┘
```

## 기술 스택
| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16 + Tailwind CSS 4 |
| Backend | Next.js API Routes (20개 라우트) |
| Database | Supabase PostgreSQL 17 + pgvector (HNSW 768차원) |
| ORM | Prisma 6 |
| LLM | Google Gemini 2.0 Flash (답변 생성 + 의도 분류) |
| Embedding | Google Gemini embedding-001 (768차원) |
| AI Framework | Vercel AI SDK (@ai-sdk/google) |
| PDF 처리 | pdf-parse v2 + 키워드 자동분류 |
| Markdown | react-markdown + remark-gfm |
| 배포 | Vercel (Production) |

## RAG 파이프라인
```
[사용자 질문]
    ↓
[의도 분류] (Gemini Flash)
    ├── LOOKUP → SQL 직접 조회 (물성 수치)
    ├── COMPARE → SQL + RAG
    ├── RECOMMEND → SQL 필터 + RAG
    └── EXPLAIN/GENERAL → RAG 검색
    ↓
[하이브리드 검색]
    ├── pgvector 코사인 유사도 (HNSW 인덱스)
    ├── 다중 키워드 ILIKE OR (한국어 조사 제거)
    └── 제품 DB 직접 조회 (모든 의도에서 실행)
    ↓
[답변 생성] (Gemini Flash + 컨텍스트)
    ↓
[Markdown 렌더링 답변 + 출처 표시] → 출처 클릭 → 상세 패널
```

### 키워드 검색 상세
- `extractKeywords()`: 한국어 어미/조사를 단어 경계에서만 제거
- 다중 키워드 ILIKE OR 쿼리 (최대 5개)
- 매칭 키워드 수 기반 동적 점수 (0.3~1.0)
- 키워드 매칭 가중치 > 벡터 유사도 가중치 (한국어 정확 매칭 우선)

### 제품 조회
- 제품 코드 패턴 감지 시 직접 DB 조회
- 코드 없으면 키워드 분리 후 name/code/usage/description/category 검색
- 모든 의도 유형에서 실행 (LOOKUP뿐 아니라 EXPLAIN/GENERAL에서도)

## PDF 업로드 파이프라인
```
[PDF 업로드] → [텍스트 추출 (pdf-parse v2)]
    → [키워드 자동분류 (TDS/MSDS/시험성적서/...)]
    → [청킹 (섹션+크기+테이블 분리, 800토큰, 100토큰 오버랩)]
    → [Gemini 임베딩 (768차원, 배치 100건)]
    → [pgvector 저장 + HNSW 인덱스]
    → AI 채팅에서 검색 가능
```

## 디렉토리 구조
```
vapmortarwiki/
├── CLAUDE.md                    # AI 어시스턴트 지시 (핵심만)
├── README.md                    # 프로젝트 소개
├── docs/
│   ├── architecture.md          # 시스템 아키텍처 (이 파일)
│   ├── database.md              # DB 스키마, 데이터 현황
│   ├── api.md                   # API/페이지 라우트 명세
│   ├── changelog.md             # 진행 이력
│   ├── user-guide.md            # 마케팅팀 사용 가이드
│   └── archive/                 # 초기 기획 산출물
│       ├── AI_RAG_설계.md
│       ├── UI_레퍼런스_분석.md
│       ├── UI_레퍼런스_분석_보고서.md
│       ├── 화면설계_와이어프레임.md
│       ├── 특수몰탈_시장조사_종합보고서.md
│       └── Saint-Gobain_Fosroc_건설화학_종합분석.md
├── prisma/
│   ├── schema.prisma            # DB 스키마
│   └── seed.ts                  # 초기 데이터 시드
├── src/
│   ├── app/                     # Next.js 페이지 + API Routes
│   ├── components/              # UI 컴포넌트
│   └── lib/                     # 비즈니스 로직
│       ├── rag/                 # RAG 파이프라인
│       └── pdf/                 # PDF 처리
├── downloads/                   # 경쟁사 참고 PDF (8개)
└── references/                  # PDF 다운로드 목록
```

## 환경 변수
```
DATABASE_URL       # Supabase pooler (pgbouncer)
DIRECT_URL         # Supabase direct
GOOGLE_GENERATIVE_AI_API_KEY   # Vercel AI SDK용
GOOGLE_GEMINI_API_KEY          # 임베딩 API용
```

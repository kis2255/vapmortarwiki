# VAP 특수몰탈 위키 프로젝트

## 프로젝트 개요
특수몰탈 마케팅 부서의 기술자료를 체계적으로 DB화하고, Wikipedia 형태의 내부 기술 위키로 제공하는 프로젝트.
사용자가 자연어 질문을 통해 제품 물성, 시공방법, KS 규격, 글로벌 경쟁사 분석 등에 대한 AI 기반 답변을 받을 수 있는 RAG 시스템 포함.

## 배포 URL
- **Production**: https://vapmortarwiki.vercel.app
- **GitHub**: https://github.com/kis2255/vapmortarwiki

## 기술 스택
| 구분 | 기술 |
|------|------|
| **Frontend** | Next.js 16 + Tailwind CSS 4 |
| **Backend** | Next.js API Routes (19개 라우트) |
| **Database** | Supabase PostgreSQL 17 + pgvector (HNSW 768차원) |
| **ORM** | Prisma 6 |
| **LLM** | Google Gemini 2.0 Flash (답변 생성 + 의도 분류) |
| **Embedding** | Google Gemini embedding-001 (768차원, outputDimensionality) |
| **AI Framework** | Vercel AI SDK (@ai-sdk/google) |
| **PDF 처리** | pdf-parse v2 (텍스트 추출) + 키워드 자동분류 |
| **Markdown** | react-markdown + remark-gfm (테이블/GFM 지원) |
| **배포** | Vercel (Production) |
| **API 키** | GOOGLE_GEMINI_API_KEY 1개로 LLM + Embedding 통합 |

## 시스템 아키텍처
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

### RAG 파이프라인
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
    ├── pgvector 코사인 유사도 (벡터 339건, HNSW 인덱스)
    └── 키워드 매칭 (전문검색)
    ↓
[답변 생성] (Gemini Flash + 컨텍스트)
    ↓
[답변 + 출처 표시] → 출처 클릭 → 오른쪽 상세 패널
```

### PDF 업로드 파이프라인
```
[PDF 업로드] → [텍스트 추출 (pdf-parse v2)]
    → [키워드 자동분류 (TDS/MSDS/시험성적서/...)]
    → [청킹 (섹션+크기+테이블 분리)]
    → [Gemini 임베딩 (768차원, 배치 100건)]
    → [pgvector 저장 + HNSW 인덱스]
    → AI 채팅에서 검색 가능
```

## 디렉토리 구조 (현행)
```
vapmortarwiki/
├── CLAUDE.md                              # 프로젝트 설계 문서 (이 파일)
├── package.json                           # Next.js + 의존성
├── vercel.json                            # Vercel 배포 설정
├── prisma/
│   ├── schema.prisma                      # DB 스키마 (PostgreSQL + pgvector)
│   └── seed.ts                            # 초기 데이터 시드
├── docs/                                  # 기획/조사 문서 (7개)
│   ├── 특수몰탈_시장조사_종합보고서.md
│   ├── AI_RAG_설계.md
│   ├── UI_레퍼런스_분석.md
│   ├── UI_레퍼런스_분석_보고서.md
│   ├── 화면설계_와이어프레임.md
│   ├── 마케팅팀_사용가이드.md
│   └── Saint-Gobain_Fosroc_건설화학_종합분석.md
├── downloads/                             # 다운로드된 참고 PDF (8개)
├── references/
│   └── pdf_download_list.md               # PDF 다운로드 가능 목록 (31건)
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # 3열 레이아웃
│   │   ├── page.tsx                       # 대시보드 (벤토 그리드)
│   │   ├── globals.css                    # 컬러 시스템 + 다크모드
│   │   ├── chat/page.tsx                  # AI 채팅 (출처 상세 패널)
│   │   ├── products/
│   │   │   ├── page.tsx                   # 제품 목록 (카테고리 배지)
│   │   │   ├── [id]/page.tsx              # 제품 상세 (물성 테이블 + Infobox)
│   │   │   └── new/page.tsx               # 제품 등록 폼
│   │   ├── wiki/
│   │   │   ├── page.tsx                   # 위키 목록
│   │   │   ├── [slug]/page.tsx            # 위키 상세 (react-markdown)
│   │   │   ├── new/page.tsx               # 위키 작성 에디터
│   │   │   └── standards/page.tsx         # KS 규격 목록
│   │   ├── upload/page.tsx                # PDF 업로드
│   │   ├── search/page.tsx                # 통합 검색
│   │   └── api/
│   │       ├── chat/route.ts              # RAG 답변 API
│   │       ├── search/route.ts            # 통합 검색 API
│   │       ├── products/route.ts          # 제품 CRUD
│   │       ├── products/[id]/route.ts     # 제품 상세 API
│   │       ├── articles/route.ts          # 위키 CRUD
│   │       ├── articles/[id]/route.ts     # 위키 상세 API
│   │       └── upload/route.ts            # PDF 업로드 + 분류 + 임베딩
│   ├── components/
│   │   ├── layout/sidebar.tsx             # 사이드바 (카테고리 컬러 도트)
│   │   ├── layout/header.tsx              # 헤더 (블러 + Ctrl+K)
│   │   ├── ui/category-badge.tsx          # 카테고리 배지 컴포넌트
│   │   └── wiki/article-content.tsx       # Markdown 렌더링 (react-markdown)
│   └── lib/
│       ├── db/prisma.ts                   # Prisma 클라이언트
│       ├── utils.ts                       # cn(), formatDate(), slugify()
│       ├── rag/
│       │   ├── chunker.ts                 # 문서 청킹 (섹션+크기+테이블)
│       │   ├── embedder.ts                # Gemini 임베딩 (768차원, 배치100)
│       │   ├── retriever.ts               # 하이브리드 검색 (pgvector + 키워드)
│       │   └── generator.ts               # 의도분류 + 컨텍스트 + Gemini 답변
│       └── pdf/
│           ├── extractor.ts               # PDF 텍스트 추출 (pdf-parse v2)
│           └── classifier.ts              # 자동 분류 (키워드 + 파일명)
```

## 데이터 모델 (Prisma 스키마)

### 현행 DB 현황 (Supabase)
| 테이블 | 건수 | 설명 |
|--------|------|------|
| categories | 5 | 보수/방수/바닥/주입/그라우트 |
| products | 7 | VAP 제품 (물성 27건) |
| standards | 13 | KS 7 + EN/ASTM/ACI/BS 6 |
| articles | 16 | 위키 문서 |
| documents | 8 | 업로드 PDF |
| embeddings | 377 | 벡터 339건 (HNSW 인덱스) |

### 엔티티 관계
```
Category ──< Product ──< ProductProperty
    │            │──< ProductStandard >── Standard
    │            │──< Document ──< Embedding
    │            └──< ArticleProduct
    └──< Article ──< Embedding
                └──< ArticleProduct
ChatSession ──< ChatMessage
```

## 페이지 맵 (19개 라우트)
| 경로 | 타입 | 기능 |
|------|------|------|
| `/` | Dynamic | 대시보드 (통계 카드, AI 배너, 최근문서, 시장동향) |
| `/products` | Dynamic | 제품 목록 (카테고리 배지, 필터, 검색) |
| `/products/[id]` | Dynamic | 제품 상세 (물성 합격/불합격 테이블, Infobox, 시공방법) |
| `/products/new` | Static | 제품 등록 폼 |
| `/wiki` | Dynamic | 위키 목록 (태그, 카테고리) |
| `/wiki/[slug]` | Dynamic | 위키 상세 (react-markdown, TOC, 태그) |
| `/wiki/new` | Static | 위키 Markdown 에디터 + 미리보기 |
| `/wiki/standards` | Dynamic | KS/EN/ASTM 규격 목록 (관련 제품 링크) |
| `/chat` | Static | AI 채팅 (출처 클릭 → 오른쪽 상세 패널) |
| `/upload` | Static | PDF 드래그앤드롭 업로드 + 자동분류 |
| `/search` | Static | 통합 검색 (유형별 필터 탭) |
| `/api/chat` | API | RAG 답변 (의도분류 → 검색 → Gemini 생성) |
| `/api/search` | API | 통합 검색 (제품/문서/PDF/규격) |
| `/api/products` | API | 제품 GET/POST |
| `/api/products/[id]` | API | 제품 상세 GET |
| `/api/articles` | API | 위키 GET/POST (+임베딩 자동생성) |
| `/api/articles/[id]` | API | 위키 상세 GET (id 또는 slug) |
| `/api/upload` | API | PDF 업로드 → 추출 → 분류 → 임베딩 |

## 업로드된 PDF 현황
| # | 파일명 | 분류 | 페이지 | 임베딩 청크 | 출처 |
|---|--------|------|--------|-----------|------|
| 1 | Sika_EN1504_Concrete_Repair_Guide.pdf | GUIDE | 56p | 151 | Sika 글로벌 |
| 2 | KR_Construction_Quality_Test_Standards.pdf | TEST_REPORT | 51p | 74 | 국토교통부 |
| 3 | Fosroc_Renderoc_S_TDS.pdf | TDS | 4p | 23 | Fosroc/Resapol |
| 4 | Sika_Concrete_Repair_Site_Handbook.pdf | GUIDE | 13p | 21 | Sika 글로벌 |
| 5 | ARDEX_A38_TDS.pdf | TDS | 4p | 21 | ARDEX UK |
| 6 | Fosroc_Conbextra_GP_TDS.pdf | TDS | 4p | 18 | Fosroc AU |
| 7 | Weber_rep_R4_duo_TDS.pdf | TDS | 3p | 16 | Weber/Resapol |
| 8 | SikaGrout-212_TDS.pdf | TDS | 4p | 15 | Sika USA |

### PDF 확인 방법
1. **대시보드**: https://vapmortarwiki.vercel.app → "업로드 PDF" 카드에 건수 표시
2. **업로드 페이지**: https://vapmortarwiki.vercel.app/upload → 업로드 이력 (추후 목록 구현)
3. **AI 채팅**: https://vapmortarwiki.vercel.app/chat → PDF 내용 기반 질문 시 출처에 표시
4. **Supabase DB**: https://supabase.com/dashboard/project/upzjbsrlaqdykykftuvv → Table Editor → documents/embeddings 테이블

### PDF가 반영되는 방식
```
PDF 업로드 → 텍스트 추출 → 청킹(15~151건)
    → Gemini 임베딩(768차원) → pgvector 저장
    → AI 채팅 질문 시 벡터 유사도 검색으로 관련 청크 검색
    → Gemini가 검색된 청크를 참고하여 답변 생성
    → 답변 하단 "출처"에 PDF 파일명 표시
```

## 위키 문서 현황 (16건)

### VAP 제품/기술
| 문서 | 경로 |
|------|------|
| 폴리머 시멘트 모르타르 | `/wiki/polymer-cement-mortar` |
| 콘크리트 구조물 보수보강 개요 | `/wiki/concrete-repair-overview` |
| KS F 4042 규격 해설 | `/wiki/ks-f-4042-guide` |

### 시장 동향
| 문서 | 경로 |
|------|------|
| 국내 보수보강 시장 동향 | `/wiki/domestic-market-trend` |
| 글로벌 특수몰탈 시장 동향 | `/wiki/global-market-trend` |

### 기술 심화
| 문서 | 경로 |
|------|------|
| 콘크리트 탄산화(중성화) 메커니즘과 보수 | `/wiki/concrete-carbonation` |
| 염화물 유발 철근 부식과 보수 | `/wiki/chloride-corrosion` |
| 에폭시 vs 폴리우레탄 주입 비교 | `/wiki/epoxy-vs-polyurethane` |
| 셀프레벨링 몰탈 기술 | `/wiki/self-leveling-mortar` |
| 무수축 그라우트 - 철골 구조물 적용 | `/wiki/grout-steel-structure` |
| EN 1504 유럽 보수 표준 해설 | `/wiki/en-1504-guide` |
| 글로벌 주요 보수몰탈 제품 비교 | `/wiki/global-product-comparison` |

### 경쟁사 분석
| 문서 | 경로 |
|------|------|
| Saint-Gobain 건설화학 사업 분석 | `/wiki/saint-gobain-overview` |
| Fosroc 보수몰탈 제품 라인업 | `/wiki/fosroc-product-lineup` |
| Fosroc Conbextra 그라우트 분석 | `/wiki/fosroc-conbextra-grout` |
| Weber 보수/방수/바닥 제품 분석 | `/wiki/weber-product-analysis` |

## 진행 완료 이력

| Phase | 상태 | 주요 내용 |
|-------|------|----------|
| 1. 기획/조사 | ✅ | 시장조사, PDF 분류 체계, 데이터 모델 |
| 2. UI 설계 | ✅ | 5개 플랫폼 분석, 와이어프레임 7개 화면 |
| 2.5. AI/RAG 설계 | ✅ | 하이브리드 검색, 의도 분류, 안전장치 |
| 3. 개발 | ✅ | Next.js 19개 라우트, RAG 파이프라인 |
| 4. 자료 입력 | ✅ | 제품 7, 규격 13, 위키 16, PDF 8 |
| 5. 테스트/배포 | ✅ | Gemini E2E, Vercel 배포 |
| 6. Supabase 전환 | ✅ | PostgreSQL + pgvector HNSW |
| 7. UI 개선 | ✅ | 컬러 시스템, 배지, 물성 테이블, 채팅 버블 |
| 8. 글로벌 자료 | ✅ | Saint-Gobain/Fosroc/Weber, EN1504, PDF 8건 |

## 환경 변수
```
DATABASE_URL="postgres://...@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://...@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."  # Vercel AI SDK용
GOOGLE_GEMINI_API_KEY="AIza..."          # 임베딩 API용
```

## 컨벤션
- 코드: TypeScript, ESLint
- 커밋: 한글 허용, conventional commits
- 문서: Markdown
- 변수명: camelCase (JS/TS), Prisma 기본 (DB)
- 카테고리 컬러: 보수(블루), 방수(시안), 바닥(퍼플), 주입(앰버), 그라우트(에메랄드)

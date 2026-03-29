# 삼표 특수몰탈 기술 위키

## 프로젝트 개요
삼표그룹 특수몰탈 마케팅 부서의 기술자료를 체계적으로 DB화하고, Wikipedia 형태의 내부 기술 위키로 제공하는 프로젝트.
사용자가 자연어 질문을 통해 자사 제품 물성, 시공방법, KS/EN/ASTM 규격, 글로벌 경쟁사 분석 등에 대한 AI 기반 답변을 받을 수 있는 RAG 시스템 포함.

> **삼표 = 자사**. Sika, Fosroc, Weber, Saint-Gobain 등이 경쟁사.
> VAP은 삼표의 특수몰탈 브랜드명 중 하나.

## 배포 URL
- **Production**: https://vapmortarwiki.vercel.app
- **GitHub**: https://github.com/kis2255/vapmortarwiki

## 기술 스택
| 구분 | 기술 |
|------|------|
| **Frontend** | Next.js 16 + Tailwind CSS 4 |
| **Backend** | Next.js API Routes (20개 라우트) |
| **Database** | Supabase PostgreSQL 17 + pgvector (HNSW 768차원) |
| **ORM** | Prisma 6 |
| **LLM** | Google Gemini 2.0 Flash (답변 생성 + 의도 분류) |
| **Embedding** | Google Gemini embedding-001 (768차원, outputDimensionality) |
| **AI Framework** | Vercel AI SDK (@ai-sdk/google) |
| **PDF 처리** | pdf-parse v2 (텍스트 추출) + 키워드 자동분류 |
| **Markdown** | react-markdown + remark-gfm (채팅 답변 + 위키 + 규격 상세) |
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
    ├── pgvector 코사인 유사도 (HNSW 인덱스)
    ├── 다중 키워드 ILIKE OR (한국어 조사 제거)
    └── 제품 DB 직접 조회 (모든 의도에서 실행)
    ↓
[답변 생성] (Gemini Flash + 컨텍스트)
    ↓
[Markdown 렌더링 답변 + 출처 표시] → 출처 클릭 → 오른쪽 상세 패널
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
├── downloads/                             # 다운로드된 참고 PDF (8개)
├── references/
│   └── pdf_download_list.md               # PDF 다운로드 가능 목록 (31건)
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # 3열 레이아웃
│   │   ├── page.tsx                       # 대시보드 (벤토 그리드)
│   │   ├── globals.css                    # 컬러 시스템 + 다크모드
│   │   ├── chat/page.tsx                  # AI 채팅 (마크다운 렌더링 + 출처 패널)
│   │   ├── products/
│   │   │   ├── page.tsx                   # 제품 목록 (카테고리 배지)
│   │   │   ├── [id]/page.tsx              # 제품 상세 (물성 테이블 + Infobox)
│   │   │   └── new/page.tsx               # 제품 등록 폼
│   │   ├── wiki/
│   │   │   ├── page.tsx                   # 위키 목록
│   │   │   ├── [slug]/page.tsx            # 위키 상세 (react-markdown)
│   │   │   ├── new/page.tsx               # 위키 작성 에디터
│   │   │   └── standards/
│   │   │       ├── page.tsx               # 규격/표준 목록 (카테고리별 그룹핑)
│   │   │       └── [id]/page.tsx          # 규격 상세 (Infobox + 관련제품/문서)
│   │   ├── upload/page.tsx                # PDF 업로드
│   │   ├── search/page.tsx                # 통합 검색
│   │   └── api/
│   │       ├── chat/route.ts              # RAG 답변 API
│   │       ├── search/route.ts            # 통합 검색 API
│   │       ├── products/route.ts          # 제품 CRUD
│   │       ├── products/[id]/route.ts     # 제품 상세 API
│   │       ├── articles/route.ts          # 위키 CRUD
│   │       ├── articles/[id]/route.ts     # 위키 상세 GET + PUT(편집)
│   │       └── upload/route.ts            # PDF 업로드 + 분류 + 임베딩
│   ├── components/
│   │   ├── layout/sidebar.tsx             # 사이드바 (계층형 카테고리)
│   │   ├── layout/header.tsx              # 헤더 (블러 + Ctrl+K)
│   │   ├── ui/category-badge.tsx          # 카테고리 배지 컴포넌트
│   │   └── wiki/article-content.tsx       # Markdown 렌더링 (react-markdown)
│   └── lib/
│       ├── db/prisma.ts                   # Prisma 클라이언트
│       ├── utils.ts                       # cn(), formatDate(), slugify()
│       ├── rag/
│       │   ├── chunker.ts                 # 문서 청킹 (섹션+크기+테이블)
│       │   ├── embedder.ts                # Gemini 임베딩 (768차원, 배치100)
│       │   ├── retriever.ts               # 하이브리드 검색 (다중 ILIKE + pgvector)
│       │   └── generator.ts               # 의도분류 + 컨텍스트 + Gemini 답변
│       └── pdf/
│           ├── extractor.ts               # PDF 텍스트 추출 (pdf-parse v2)
│           └── classifier.ts              # 자동 분류 (키워드 + 파일명)
```

## 데이터 모델 (Prisma 스키마)

### 현행 DB 현황 (Supabase)
| 테이블 | 건수 | 설명 |
|--------|------|------|
| categories | 8 | 그라우트/보수/방수/바닥/주입/타일/시장경쟁사/국제규격 |
| products | 15 | 삼표 특수몰탈 (물성 27건) |
| standards | 13 | KS 7 + KDS 1 + EN 2 + ASTM 2 + ACI 1 + BS 1 |
| articles | 16 | 위키 문서 |
| documents | 8 | 업로드 PDF |
| embeddings | ~390 | 벡터 (HNSW 인덱스) |

### 삼표 특수몰탈 제품 현황 (15종)
| 카테고리 | 제품코드 | 제품명 | 28일 압축강도 | 적용 규격 |
|---------|---------|--------|-------------|---------|
| 그라우트 | SG 45N | 범용 무수축 그라우트 | 48 MPa | KS F 4044, ASTM C1107 |
| 그라우트 | SG 60P | 패드형 무수축 그라우트 | 63 MPa | KS F 4044, ASTM C1107 |
| 그라우트 | SG 70S | PC슬리브용 무수축 그라우트 | 73 MPa | KS F 4044, ASTM C1107 |
| 그라우트 | SG 70S+ | PC슬리브용 (개선형) | 75 MPa | KS F 4044 |
| 그라우트 | SG 80ES | 초속경 무수축 그라우트 | 83 MPa (3h: 22) | KS F 4044, ASTM C1107 |
| 그라우트 | SP-RAIL | 철도용 무수축 몰탈 | - | KS F 4044 |
| 보수몰탈 | SPPM 400 | 폴리머시멘트 보수몰탈 | 42 MPa | KS F 4042, KS F 2476 |
| 바닥몰탈 | SPSL 1040 | 자기수평 몰탈 | 30 MPa | KS F 4716 |
| 바닥몰탈 | SFM-1000 | 일반바닥용 몰탈 | - | - |
| 바닥몰탈 | SFM-2000 | 고급바닥용 몰탈 | - | - |
| 바닥몰탈 | SFM-2000H | 고강도바닥용 몰탈 | - | - |
| 타일용 | ST-100 | 타일압착용 (백색) | - | - |
| 타일용 | ST-101 | 타일압착용 (회색) | - | - |
| 타일용 | ST-2000 | 타일줄눈용 (백색) | - | - |
| 타일용 | ST-2001 | 타일줄눈용 (회색) | - | - |

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

## 사이드바 메뉴 구조
```
대시보드
제품 DB
위키 문서
PDF 문서
AI 질의응답
통합 검색
규격/표준
▾ 카테고리
  ▾ 제품
      ● 그라우트
      ● 보수몰탈
      ● 바닥몰탈
      ● 타일용
  ● 시장/경쟁사
  ● 국제규격
```

## 사용자 설정 기능
| 기능 | 설명 | 저장 |
|------|------|------|
| **다크/라이트 모드** | 헤더 우측 Sun/Monitor/Moon 토글. 3가지: 라이트/시스템/다크 | localStorage `vap-theme` |
| **폰트 크기 조절** | 헤더 우측 -/+/보통 버튼. 3단계: 작게(13px)/보통(14px)/크게(16px) | localStorage `vap-fontsize` |
| **모바일 사이드바** | 햄버거 메뉴 → 오버레이 + 슬라이드 사이드바 | - |

## 페이지 맵 (22개 라우트)
| 경로 | 타입 | 기능 |
|------|------|------|
| `/` | Dynamic | 대시보드 (통계 카드, AI 배너, 최근문서, 시장동향) |
| `/products` | Dynamic | 제품 목록 (카테고리 배지, 필터, 검색) |
| `/products/[id]` | Dynamic | 제품 상세 (물성 합격/불합격 테이블, Infobox, 시공방법) |
| `/products/new` | Static | 제품 등록 폼 |
| `/wiki` | Dynamic | 위키 목록 (16건, 태그, 카테고리) |
| `/wiki/[slug]` | Dynamic | 위키 상세 (react-markdown, TOC, 태그, 편집 버튼) |
| `/wiki/[slug]/edit` | Static | 위키 편집 (제목/본문/태그/카테고리 수정, 버전 자동 증가) |
| `/wiki/new` | Static | 위키 Markdown 에디터 + 미리보기 |
| `/wiki/standards` | Dynamic | 규격/표준 목록 (카테고리별 그룹핑 KS/KDS/EN/ASTM/ACI/BS) |
| `/wiki/standards/[id]` | Dynamic | 규격 상세 (마크다운 해설 + Infobox + 관련제품/문서) |
| `/documents` | Dynamic | PDF 문서 목록 (파일명, 분류, 페이지, 임베딩 건수) |
| `/chat` | Static | AI 채팅 (마크다운 렌더링 답변 + 출처 상세 패널) |
| `/upload` | Static | PDF 드래그앤드롭 업로드 + 자동분류 |
| `/search` | Static | 통합 검색 (실시간 결과 카드, 유형별 필터 탭 + 건수 배지) |
| `/api/chat` | API | RAG 답변 (의도분류 → 하이브리드 검색 → Gemini 생성) |
| `/api/search` | API | 통합 검색 (제품/문서/PDF/규격) |
| `/api/products` | API | 제품 GET/POST |
| `/api/products/[id]` | API | 제품 상세 GET |
| `/api/articles` | API | 위키 GET/POST (+임베딩 자동생성) |
| `/api/articles/[id]` | API | 위키 상세 GET + PUT(편집) |
| `/api/upload` | API | PDF 업로드 → 추출 → 분류 → 임베딩 |

## 업로드된 PDF 현황 (경쟁사 TDS/가이드)
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

## 위키 문서 현황 (16건)

### 자사 기술
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

## 규격/표준 현황 (13건)
| 분류 | 코드 | 규격명 |
|------|------|--------|
| KS | KS F 4042 | 콘크리트 구조물 보수용 폴리머 시멘트 모르타르 |
| KS | KS F 4044 | 수경성 시멘트 무수축 그라우트 |
| KS | KS F 2476 | 폴리머 시멘트 모르타르의 시험방법 |
| KS | KS F 4716 | 시멘트계 바탕 바름재 |
| KS | KS F 4916 | 시멘트 혼화용 폴리머 |
| KS | KS F 2624 | 균열 보수용 직접 주입재의 내피로 성능 시험방법 |
| KDS | KDS 14 31 05 | 콘크리트 구조물 보수보강 설계기준 |
| EN | EN 1504 | 유럽 콘크리트 보수 표준 (전 10부) |
| EN | EN 1504-3 | 콘크리트 구조/비구조 보수 등급 (R1~R4) |
| ASTM | ASTM C928 | 급속경화 시멘트계 보수재 |
| ASTM | ASTM C1107 | 무수축 시멘트계 그라우트 |
| ACI | ACI 546 | 콘크리트 보수 가이드 (2023) |
| BS | BS 6319 | 수지/폴리머 조성물 시험방법 |

## 진행 완료 이력

| Phase | 상태 | 주요 내용 |
|-------|------|----------|
| 1. 기획/조사 | ✅ | 시장조사, PDF 분류 체계, 데이터 모델 |
| 2. UI 설계 | ✅ | 5개 플랫폼 분석, 와이어프레임 7개 화면 |
| 2.5. AI/RAG 설계 | ✅ | 하이브리드 검색, 의도 분류, 안전장치 |
| 3. 개발 | ✅ | Next.js 22개 라우트, RAG 파이프라인 |
| 4. 자료 입력 | ✅ | 제품 15, 규격 13, 위키 16, PDF 8 |
| 5. 테스트/배포 | ✅ | Gemini E2E, Vercel 배포 |
| 6. Supabase 전환 | ✅ | PostgreSQL + pgvector HNSW |
| 7. UI 개선 | ✅ | 컬러 시스템, 배지, 물성 테이블, 채팅 버블 |
| 8. 글로벌 자료 | ✅ | Saint-Gobain/Fosroc/Weber, EN1504, PDF 8건 |
| 9. 기능 확장 | ✅ | PDF 목록, 검색 결과, 위키 편집, 모바일 사이드바 |
| 10. 사용자 설정 | ✅ | 다크/라이트/시스템 모드 토글, 폰트 크기 3단계 조절 |
| 11. RAG 검색 개선 | ✅ | 다중 ILIKE 키워드, 한국어 조사 제거, 제품 조회 확대 |
| 12. 채팅 마크다운 | ✅ | ReactMarkdown + GFM 렌더링 (답변 + 출처 패널) |
| 13. 규격/표준 개편 | ✅ | KS 규격→규격/표준, 상세페이지, 13건 마크다운 해설 |
| 14. 사이드바 개편 | ✅ | 계층 구조 (제품>하위), 메뉴 중복 활성화 수정 |
| 15. 제품 DB 교체 | ✅ | VAP 7종 → 삼표 특수몰탈 15종 (SG/SPPM/SPSL/SFM/ST) |

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
- 카테고리 컬러: 그라우트(에메랄드), 보수(블루), 방수(시안), 바닥(퍼플), 주입(앰버), 타일(오렌지), 시장경쟁사(로즈), 국제규격(인디고)

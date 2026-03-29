# VAP 특수몰탈 위키 프로젝트

## 프로젝트 개요
특수몰탈 마케팅 부서의 기술자료를 체계적으로 DB화하고, Wikipedia 형태의 내부 기술 위키로 제공하는 프로젝트.
사용자가 자연어 질문을 통해 제품 물성, 시공방법, KS 규격 등에 대한 AI 기반 답변을 받을 수 있는 RAG 시스템 포함.

## 기술 스택 (예정)
- **Frontend**: Next.js + Tailwind CSS (위키 스타일 UI)
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL + pgvector (HNSW 인덱스)
- **ORM**: Prisma
- **PDF 처리**: pdfjs-dist (뷰어 + 텍스트 추출), Tesseract.js (OCR)
- **검색**: 전문검색 (Full-text) + 벡터 유사도 검색 (Hybrid)
- **AI/RAG**:
  - LLM: Google Gemini 2.0 Flash — 답변 생성, 의도 분류
  - Embedding: Google Gemini text-embedding-004 (768차원)
  - Framework: Vercel AI SDK (@ai-sdk/google)
  - API 키: GOOGLE_GEMINI_API_KEY 1개로 LLM + Embedding 통합
- **배포**: Vercel 또는 사내 서버

## 디렉토리 구조 (계획)
```
vapmortarwiki/
├── CLAUDE.md                          # 프로젝트 관리 문서 (이 파일)
├── docs/                              # 시장조사, 기획 문서
│   └── 특수몰탈_시장조사_종합보고서.md
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── page.tsx                   # 메인 페이지
│   │   ├── wiki/                      # 위키 문서 페이지
│   │   ├── products/                  # 제품 DB 페이지
│   │   ├── upload/                    # PDF 업로드 페이지
│   │   ├── search/                    # 검색 페이지
│   │   ├── chat/                      # AI 채팅 페이지
│   │   └── api/
│   │       ├── chat/                  # AI 채팅 API (RAG)
│   │       ├── upload/                # PDF 업로드 API
│   │       ├── embed/                 # 임베딩 생성 API
│   │       └── search/                # 검색 API
│   ├── components/                    # 공통 컴포넌트
│   │   ├── layout/                    # 사이드바, 헤더, 네비게이션
│   │   ├── wiki/                      # 위키 관련 컴포넌트
│   │   ├── chat/                      # AI 채팅 컴포넌트
│   │   └── upload/                    # 업로드 관련 컴포넌트
│   ├── lib/                           # 유틸리티, DB 연결
│   │   ├── rag/                       # RAG 파이프라인
│   │   │   ├── chunker.ts             # 문서 청킹
│   │   │   ├── embedder.ts            # 임베딩 생성
│   │   │   ├── retriever.ts           # 하이브리드 검색
│   │   │   └── generator.ts           # LLM 답변 생성
│   │   └── pdf/                       # PDF 처리
│   │       ├── extractor.ts           # 텍스트 추출
│   │       ├── ocr.ts                 # OCR 처리
│   │       └── classifier.ts          # 자동 분류
│   └── types/                         # TypeScript 타입 정의
├── prisma/                            # DB 스키마
│   └── schema.prisma
├── public/
│   └── uploads/                       # 업로드된 PDF 저장
└── data/                              # 초기 데이터, 시드
```

## 데이터 모델 (핵심 엔티티)

### Category (카테고리)
- 대분류: 보수몰탈, 방수몰탈, 바닥몰탈, 주입재, 그라우트 등
- 중분류/소분류 지원 (트리 구조)

### Product (제품)
- 제품명, 제품코드, 카테고리
- 용도, 특징, 적용범위
- 물성 데이터 (압축강도, 부착강도, 휨강도 등)
- 관련 규격 (KS F 4042 등)

### Article (위키 문서)
- 제목, 본문 (Markdown)
- 카테고리, 태그
- 연결된 제품
- 버전 이력, 작성자

### Document (업로드 PDF)
- 파일명, 파일경로, 파일크기
- 문서유형: TDS / MSDS / 시험성적서 / 인증서 / 시공사례 / 카탈로그 / 기술논문 / 기타
- 자동분류 결과 + 수동 확정 여부
- 연결된 제품/문서
- OCR 추출 텍스트 (검색용)

### Standard (규격/표준)
- 규격번호 (KS F 4042 등)
- 규격명, 설명
- 연결된 제품

### Embedding (벡터 임베딩)
- 원본 청크 텍스트, 임베딩 벡터 (1536차원)
- 출처 (Document/Article/Product ID)
- 메타데이터 (문서유형, 제품코드, 페이지번호)

### ChatHistory (대화 이력)
- 세션ID, 질문, 답변
- 참조된 출처 목록
- 사용자 피드백 (유용/비유용)

## PDF 자동 분류 키워드 규칙
| 문서유형 | 판별 키워드 |
|---------|------------|
| TDS | 배합비, 시공방법, 양생, 물시멘트비, 혼화재, 적용범위 |
| MSDS | CAS번호, 노출기준, 유해성, 응급조치, 안전보건자료 |
| 시험성적서 | KS F, ASTM C, 압축강도, 시험결과, 시험일자 |
| 인증서 | 인증번호, 유효기간, 적합판정, 인증기관 |
| 시공사례 | 시공일자, 현장명, 적용면적, 준공 |
| 카탈로그 | 제품라인업, 브랜드, 문의처 |

## 진행 상황

### Phase 1: 기획 및 조사 ✅
- [x] 프로젝트 구조 설계
- [x] 시장조사 (글로벌/국내 동향, KS 규격) → `docs/특수몰탈_시장조사_종합보고서.md`
- [x] PDF 분류 체계 설계
- [x] 데이터 모델 설계

### Phase 2: UI 레퍼런스 및 디자인 ✅
- [x] Wikipedia/Docusaurus/GitBook/Notion/Confluence 레퍼런스 분석 → `docs/UI_레퍼런스_분석.md`
- [x] 화면 구성안 (와이어프레임 7개 화면) → `docs/화면설계_와이어프레임.md`
- [x] 주요 페이지 목록: 메인, 제품목록, 제품상세, 위키문서, 검색, PDF업로드, KS규격
- [x] UI 설계 방향: Docusaurus(3열 레이아웃) + Wikipedia(Infobox) + GitBook(미니멀 디자인)

### Phase 2.5: AI/RAG 설계 ✅
- [x] RAG 아키텍처 설계 → `docs/AI_RAG_설계.md`
- [x] 하이브리드 검색 전략 (Vector + Keyword + SQL)
- [x] 질문 유형별 처리 전략 (6가지 유형)
- [x] AI 채팅 UI 설계
- [x] 데이터 동기화 및 안전장치 설계

### Phase 3: 개발 ✅
- [x] Next.js 프로젝트 초기화 (빌드 성공 확인)
- [x] DB 스키마 구현 (Prisma + pgvector) → `prisma/schema.prisma`
- [x] 레이아웃 (사이드바 + 헤더 + 반응형)
- [x] 메인 대시보드 페이지
- [x] 제품 목록 페이지 (DB 연동 + 필터/검색)
- [x] 제품 상세 페이지 (물성 테이블 + Infobox + 관련문서 + 시공방법)
- [x] 제품 등록 폼 (물성 데이터 동적 추가)
- [x] 위키 문서 목록 (DB 연동)
- [x] 위키 문서 상세 (Markdown 렌더링 + TOC + 태그)
- [x] 위키 문서 작성 에디터 (Markdown + 미리보기)
- [x] PDF 업로드 페이지 (드래그앤드롭 + 실제 API 연동)
- [x] PDF 업로드 API (파일저장 + 텍스트추출 + 자동분류 + 임베딩생성)
- [x] 통합 검색 페이지 (유형별 필터 탭)
- [x] AI 채팅 페이지 (대화 UI + 빠른 질문 + 출처 표시)
- [x] RAG 파이프라인 (chunker → embedder → retriever → generator)
- [x] PDF 분류기 (키워드 규칙 + 파일명 기반)
- [x] API 라우트 (/api/chat, /api/search, /api/products, /api/articles, /api/upload)
- [x] Seed 데이터 (카테고리 5개, KS 규격 5개, 샘플 제품 1개, 위키문서 1개)

### Phase 4: 자료 입력 및 테스트 ✅
- [x] SQLite 로컬 DB 설정 (PostgreSQL+pgvector 전환 준비 완료)
- [x] DB 스키마 Push + Seed 실행 성공
- [x] 초기 데이터: 카테고리 5개, KS 규격 7개, 제품 7개(물성 포함), 위키문서 5개
- [x] 검색용 청크 자동 생성 (제품 + 위키문서)
- [x] 전체 페이지 실데이터 렌더링 확인 (제품목록, 상세, 위키, 검색)
- [x] 마케팅팀 사용 가이드 작성 → `docs/마케팅팀_사용가이드.md`

### Phase 5: 통합 테스트 및 배포 준비 ✅
- [x] Gemini API 연동 테스트 (LLM 답변 + 임베딩 생성 모두 성공)
- [x] AI 채팅 E2E: RM-100 물성 조회, KS 규격 해설, 제품 비교 모두 정확
- [x] PDF 업로드 E2E: 파일저장 + 자동분류(TDS) 성공
- [x] 위키 문서 생성 시 Gemini embedding 자동 생성 (3072차원) 확인
- [x] 대시보드 실시간 DB 통계 연동
- [x] Vercel 배포 설정 (`vercel.json`)
- [x] Git 초기화 + 초기 커밋

### Supabase PostgreSQL 전환 ✅
- [x] Supabase 프로젝트 생성 (ap-northeast-2, `upzjbsrlaqdykykftuvv`)
- [x] pgvector 확장 활성화
- [x] Prisma db push → 스키마 동기화
- [x] Seed 데이터 입력 (카테고리 5, 규격 7, 제품 7, 위키 5, 검색 청크)
- [x] HNSW 벡터 인덱스 생성 (768차원)
- [x] Supabase + Gemini AI 전체 E2E 테스트 통과

### 향후 작업
- [ ] Vercel 배포 실행 (`vercel deploy`)
- [ ] 마케팅팀 실데이터 입력 시작

## 컨벤션
- 코드: TypeScript, ESLint, Prettier
- 커밋 메시지: 한글 허용, conventional commits 스타일
- 문서: Markdown 형식
- 변수명: camelCase (JS/TS), snake_case (DB)

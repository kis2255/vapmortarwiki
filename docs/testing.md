# 테스트 전략

## 프레임워크
- **Vitest** — Next.js 16 ESM 네이티브 지원, TypeScript 변환 불필요
- **Coverage** — @vitest/coverage-v8

## 우선순위

### Tier 1 — 순수 함수 (외부 의존 없음)
| 모듈 | 테스트 파일 | 테스트 수 | 핵심 |
|------|-----------|----------|------|
| chunker.ts | rag/__tests__/chunker.test.ts | 8~10 | 청킹 크기, 오버랩, 테이블 분리, 마크다운 헤딩 |
| classifier.ts | pdf/__tests__/classifier.test.ts | 10~12 | TDS/MSDS 분류, 파일명 우선, 신뢰도 |
| retriever.ts (extractKeywords) | rag/__tests__/retriever.test.ts | 6~8 | 한국어 조사 제거, 제품코드 보존 |
| utils.ts | __tests__/utils.test.ts | 5 | slugify 한국어, formatDate |

### Tier 2 — Mock 필요
| 모듈 | 테스트 수 | Mock 대상 |
|------|----------|----------|
| generator.ts (classifyIntent) | 4 | Gemini → vi.mock('ai') |
| generator.ts (buildContext) | 4 | 없음 (순수 함수) |
| retriever.ts (hybridSearch 점수) | 4 | vectorSearch, keywordSearch |

### 테스트하지 않는 것
- Prisma DB 호출 (mock이 실제 쿼리 검증 못함)
- Gemini LLM 응답 (비결정적)
- React 컴포넌트 (TypeScript + 수동 테스트)
- Next.js 라우팅/미들웨어

## 디렉토리 구조
```
src/lib/
├── rag/
│   ├── __tests__/
│   │   ├── chunker.test.ts
│   │   ├── retriever.test.ts
│   │   └── generator.test.ts
│   └── __mocks__/
│       └── embedder.ts
├── pdf/
│   └── __tests__/
│       └── classifier.test.ts
└── __tests__/
    └── utils.test.ts
```

## Mock 전략
| 의존성 | 방법 |
|--------|------|
| `@/lib/db/prisma` | `vi.mock` — findMany, $queryRawUnsafe를 vi.fn()으로 |
| `./embedder` | `__mocks__/embedder.ts` — 고정 768차원 벡터 반환 |
| `ai` (generateText) | `vi.mock('ai')` — `{ text: 'LOOKUP' }` 등 고정 반환 |
| `@ai-sdk/google` | `vi.mock` — stub model 반환 |

## 완료된 리팩토링
- ✅ `extractKeywords` 함수 export (retriever.ts)

## 실행 방법
```bash
npm test              # watch 모드
npm run test:run      # 1회 실행
npm run test:coverage # 커버리지 포함
```

## 테스트 결과 (2026-03-29, 44건 전체 통과)

### utils.test.ts (7건)
| 테스트 | 결과 |
|--------|------|
| slugify: 한국어 텍스트를 하이픈 연결로 변환 | ✅ |
| slugify: 영문을 소문자로 변환 | ✅ |
| slugify: 다중 하이픈 축소 | ✅ |
| slugify: 특수문자 제거, 한국어/영문/숫자 보존 | ✅ |
| slugify: 빈 문자열 처리 | ✅ |
| formatDate: Date 객체를 한국어 날짜로 포맷 | ✅ |
| formatDate: 문자열 입력 처리 | ✅ |

### classifier.test.ts (13건)
| 테스트 | 결과 |
|--------|------|
| classifyByKeywords: TDS 키워드 매칭 (배합비, 시공방법, 양생) | ✅ |
| classifyByKeywords: MSDS 키워드 매칭 (CAS번호, 안전보건자료) | ✅ |
| classifyByKeywords: TEST_REPORT 키워드 매칭 (시험결과, 압축강도) | ✅ |
| classifyByKeywords: CERTIFICATE 키워드 매칭 (인증번호) | ✅ |
| classifyByKeywords: 키워드 없으면 OTHER, confidence 0 | ✅ |
| classifyByKeywords: confidence가 1.0을 초과하지 않음 | ✅ |
| classifyByKeywords: 대소문자 무시 (msds → MSDS) | ✅ |
| classifyByKeywords: 혼합 키워드 시 가중치 높은 쪽 승리 | ✅ |
| classifyByFilename: TDS/MSDS/SDS/시험/인식불가 파일명 (5건) | ✅ |
| classifyDocument: 파일명 매칭 우선 (confidence 0.8) | ✅ |
| classifyDocument: 파일명 미매칭 → 키워드 폴백 | ✅ |
| classifyDocument: 둘 다 미매칭 → unknown | ✅ |

### chunker.test.ts (10건)
| 테스트 | 결과 |
|--------|------|
| chunkText: 짧은 텍스트 (20자 이상) → 단일 청크 | ✅ |
| chunkText: 20자 미만 청크는 제거 | ✅ |
| chunkText: 마크다운 헤딩으로 섹션 분할 | ✅ |
| chunkText: 테이블을 별도 청크로 분리 (section='table') | ✅ |
| chunkText: metadata에 section 정보 포함 | ✅ |
| chunkText: 빈 문자열 → 빈 배열 | ✅ |
| chunkText: metadata가 전파됨 (source, sourceId, sourceType) | ✅ |
| productToText: 모든 필드 포함 시 전체 포맷팅 | ✅ |
| productToText: null 필드 생략 (undefined 텍스트 없음) | ✅ |
| productToText: properties 없으면 물성 섹션 미포함 | ✅ |

### retriever.test.ts (14건)
| 테스트 | 결과 |
|--------|------|
| extractKeywords: 기본 키워드 추출 | ✅ |
| extractKeywords: 한국어 어미 제거 (해줘, 알려줘) | ✅ |
| extractKeywords: 질문형 어미 제거 (인가요, 뭐야) | ✅ |
| extractKeywords: 제품 코드 보존 | ✅ |
| extractKeywords: 구두점 제거 | ✅ |
| extractKeywords: 1글자 키워드 필터링 (length >= 2) | ✅ |
| extractKeywords: 빈 질문 → 원본 반환 | ✅ |
| extractKeywords: 복합 질문에서 핵심어 추출 | ✅ |
| 제품 코드 정규식: SG 80ES 형태 | ✅ |
| 제품 코드 정규식: RM-100 형태 매칭 | ✅ |
| 제품 코드 정규식: 복수 코드 추출 | ✅ |

### 단위 테스트 요약
- **4 파일, 44건 전체 통과**
- **실행 시간**: ~400ms
- **Tier 2 (Mock 필요)**: 미구현 — generator.test.ts (classifyIntent, buildContext, hybridSearch 점수)

---

## E2E 테스트 (Playwright)

### 프레임워크
- **@playwright/test** — Chromium headless
- 대상: Production (https://vapmortarwiki.vercel.app)

### 실행 방법
```bash
npm run test:e2e          # headless
npm run test:e2e:headed   # 브라우저 표시
```

### 디렉토리 구조
```
e2e/
├── navigation.spec.ts   # 페이지 네비게이션 (7건)
├── products.spec.ts     # 제품 DB (3건)
├── standards.spec.ts    # 규격/표준 (4건)
├── chat.spec.ts         # AI 채팅 (3건)
└── search.spec.ts       # 통합 검색 (2건)
```

### E2E 테스트 결과 (2026-03-29, 19건 전체 통과, 35.2s)

#### navigation.spec.ts (7건)
| 테스트 | 결과 |
|--------|------|
| 대시보드 로딩 | ✅ |
| 제품 목록 로딩 + 제품 표시 | ✅ |
| 위키 목록 로딩 | ✅ |
| 규격/표준 목록 로딩 + 카테고리 그룹핑 | ✅ |
| AI 채팅 페이지 로딩 | ✅ |
| 통합 검색 페이지 로딩 | ✅ |
| 사이드바 메뉴 표시 | ✅ |

#### products.spec.ts (3건)
| 테스트 | 결과 |
|--------|------|
| 제품 목록에서 카테고리 배지 표시 | ✅ |
| 제품 클릭 → 상세 페이지 이동 | ✅ |
| 제품 상세에서 관련 규격 링크 표시 | ✅ |

#### standards.spec.ts (4건)
| 테스트 | 결과 |
|--------|------|
| 목록에서 카테고리별 그룹핑 (KS, EN, ASTM 등) | ✅ |
| 규격 코드 클릭 → 상세 페이지 이동 | ✅ |
| 상세 페이지에서 관련 제품 링크 | ✅ |
| 상세 페이지에서 '규격/표준 목록' 뒤로가기 링크 | ✅ |

#### chat.spec.ts (3건)
| 테스트 | 결과 |
|--------|------|
| 빠른 질문 버튼 표시 | ✅ |
| 질문 입력 → AI 답변 + 출처 표시 | ✅ |
| 출처 버튼 클릭 → 상세 패널 표시 | ✅ |

#### search.spec.ts (2건)
| 테스트 | 결과 |
|--------|------|
| 검색어 입력 → 결과 표시 | ✅ |
| 헤더 검색창 동작 | ✅ |

### 전체 요약
| 종류 | 프레임워크 | 파일 | 테스트 | 통과 | 시간 |
|------|-----------|------|--------|------|------|
| 단위 테스트 | Vitest | 4 | 44 | 44 | ~400ms |
| E2E 테스트 | Playwright | 5 | 19 | 19 | ~35s |
| **합계** | | **9** | **63** | **63** | |

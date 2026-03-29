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

## 선행 리팩토링
- `extractKeywords` 함수 export (현재 private → 직접 테스트 불가)
- `splitBySections`, `extractTables` export (선택)

## 구현 순서
1. Vitest 설치 + vitest.config.ts + package.json scripts
2. Tier 1 테스트 작성 (classifier → chunker → utils → extractKeywords)
3. Tier 2 테스트 작성 (classifyIntent → buildContext → hybridSearch)

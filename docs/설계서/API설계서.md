# API 설계서 — VAP 특수몰탈 위키

> 최종 수정일: 2026-04-07

---

## 1. API 라우트 목록

| Method | Endpoint | 기능 | 인증 |
|--------|----------|------|------|
| GET | `/api/products` | 제품 목록 (필터: category, search) | - |
| POST | `/api/products` | 제품 등록 | - |
| GET | `/api/products/[id]` | 제품 상세 (물성, 규격 포함) | - |
| GET | `/api/articles` | 위키 목록 (필터: category, tag, search) | - |
| POST | `/api/articles` | 위키 등록 + 임베딩 자동생성 | - |
| GET | `/api/articles/[id]` | 위키 상세 | - |
| PUT | `/api/articles/[id]` | 위키 편집 (버전 자동 증가) | - |
| POST | `/api/chat` | AI RAG 답변 생성 | - |
| GET | `/api/chat` | 최근 대화 세션 20건 | - |
| GET | `/api/search` | 통합 검색 (제품/위키/PDF/규격) | - |
| POST | `/api/upload` | PDF 업로드 → 추출 → 분류 → 임베딩 | - |
| GET | `/api/documents/[id]` | PDF 문서 상세 | - |
| GET | `/api/dashboard/projects` | Asana 프로젝트 + 태스크 (캐시) | - |
| POST | `/api/dashboard/refresh` | Asana 캐시 강제 갱신 | - |

---

## 2. 상세 명세

### 2.1 GET /api/products

**쿼리 파라미터:**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| category | string | 카테고리 slug 필터 |
| search | string | 이름/코드 검색 |

**응답 (200):**
```json
[
  {
    "id": "sp-sg45n",
    "code": "SG 45N",
    "name": "범용 무수축 그라우트",
    "category": { "id": "...", "name": "그라우트", "slug": "grout" },
    "standards": [{ "standard": { "code": "KS F 4044", "name": "..." } }],
    "_count": { "properties": 4, "documents": 0 }
  }
]
```

### 2.2 POST /api/chat

**요청:**
```json
{
  "messages": [
    { "role": "user", "content": "KS F 4042 기준은?" }
  ],
  "sessionId": "optional-session-id"
}
```

**응답 (200):**
```json
{
  "content": "KS F 4042 품질 기준:\n\n| 시험항목 | 기준값 |\n...",
  "sources": [
    { "type": "article", "id": "ks-f-4042-guide", "title": "KS F 4042 규격 해설" }
  ],
  "sessionId": "cmnmxrmd00000s686n9sk8jmy"
}
```

**RAG 처리 흐름:**
1. 의도 분류 (LOOKUP/COMPARE/RECOMMEND/EXPLAIN/GENERAL)
2. 하이브리드 검색 (벡터 + 키워드 + 제품 DB)
3. Gemini 2.0 Flash로 답변 생성
4. 대화 이력 DB 저장

### 2.3 GET /api/search

**쿼리 파라미터:**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| q | string | 검색어 (필수) |
| type | string | 필터: product, article, document, standard |

**응답 (200):**
```json
{
  "results": [
    {
      "type": "product",
      "id": "sp-sg45n",
      "title": "범용 무수축 그라우트 (SG 45N)",
      "excerpt": "고강도가 요구되지 않는 구조물에 범용...",
      "meta": { "category": "그라우트" }
    }
  ],
  "total": 15
}
```

### 2.4 POST /api/upload

**요청:** `multipart/form-data`
| 필드 | 타입 | 설명 |
|------|------|------|
| file | File | PDF 파일 (최대 50MB) |
| productId | string | 연결할 제품 ID (선택) |

**응답 (200):**
```json
{
  "document": {
    "id": "doc-xxx",
    "fileName": "SikaGrout-212_TDS.pdf",
    "documentType": "TDS",
    "pageCount": 4,
    "embeddingCount": 12
  }
}
```

**처리 파이프라인:**
1. PDF 텍스트 추출 (pdf-parse)
2. 키워드 자동분류 (TDS/MSDS/시험성적서/기술문서/기타)
3. 청킹 (800토큰, 100토큰 오버랩)
4. Gemini 임베딩 생성 (768차원, 배치)
5. pgvector 저장

### 2.5 GET /api/dashboard/projects

**응답 (200):**
```json
[
  {
    "gid": "1234567890",
    "name": "OO공장 설비개선",
    "owner": { "gid": "111", "name": "이두한" },
    "start_on": "2026-01-15",
    "due_on": "2026-06-30",
    "status": "green",
    "total_tasks": 12,
    "completed_tasks": 8,
    "progress": 67,
    "tasks": [
      {
        "gid": "9876543210",
        "name": "설계 검토",
        "assignee": { "gid": "222", "name": "김경준" },
        "start_on": "2026-02-01",
        "due_on": "2026-03-15",
        "completed": true
      }
    ]
  }
]
```

**캐싱:** 메모리 캐시, TTL 5분 (환경변수 `ASANA_CACHE_TTL`)

### 2.6 POST /api/dashboard/refresh

**응답 (200):**
```json
{
  "success": true,
  "updated_at": "2026-04-07T05:30:00.000Z",
  "project_count": 12
}
```

---

## 3. Asana API 호출

### 3.1 사용하는 Asana API

| Asana API | 용도 |
|-----------|------|
| `GET /users/me` | 토큰 검증 |
| `GET /workspaces` | 워크스페이스 자동 조회 |
| `GET /projects?workspace={gid}` | 프로젝트 목록 |
| `GET /tasks?project={gid}` | 프로젝트별 태스크 |

### 3.2 Rate Limit

- Asana 제한: 분당 150 요청
- 프로젝트 50개 기준: 51 요청/갱신 (충분한 여유)
- 429 응답 시 Retry-After 대기 후 재시도

---

## 4. 에러 처리

| HTTP | 원인 | 응답 |
|------|------|------|
| 400 | 잘못된 요청 | `{ "error": "messages 배열이 필요합니다" }` |
| 401 | Asana 토큰 무효 | `{ "error": "Invalid Asana token" }` |
| 404 | 리소스 없음 | `{ "error": "Product not found" }` |
| 429 | Asana Rate Limit | `{ "error": "Rate limited. Retry after 60s" }` |
| 500 | 서버 오류 | `{ "error": "..." }` |

---

## 5. 페이지 라우트

| 경로 | Method | 렌더링 | 데이터 소스 |
|------|--------|--------|-----------|
| `/` | GET | SSR | Prisma (product/article/document count) |
| `/dashboard` | GET | CSR | `/api/dashboard/projects` (fetch) |
| `/products` | GET | SSR | Prisma (products + category) |
| `/products/[id]` | GET | SSR | Prisma (product + properties + standards) |
| `/wiki` | GET | SSR | Prisma (articles + category) |
| `/wiki/[slug]` | GET | SSR | Prisma (article + category) |
| `/chat` | GET | CSR | `/api/chat` (fetch) |
| `/search` | GET | CSR | `/api/search` (fetch) |
| `/documents` | GET | SSR | Prisma (documents) |

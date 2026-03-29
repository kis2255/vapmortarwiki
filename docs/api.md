# API 및 페이지 라우트

## 페이지 (14개)
| 경로 | 기능 |
|------|------|
| `/` | 대시보드 (통계 카드, AI 배너, 최근문서, 시장동향) |
| `/products` | 제품 목록 (카테고리 배지, 필터, 검색) |
| `/products/[id]` | 제품 상세 (물성 합격/불합격 테이블, Infobox, 시공방법) |
| `/products/new` | 제품 등록 폼 |
| `/wiki` | 위키 목록 (태그, 카테고리 필터) |
| `/wiki/[slug]` | 위키 상세 (react-markdown, TOC, 편집 버튼) |
| `/wiki/[slug]/edit` | 위키 편집 (버전 자동 증가) |
| `/wiki/new` | 위키 Markdown 에디터 + 미리보기 |
| `/wiki/standards` | 규격/표준 목록 (KS/KDS/EN/ASTM/ACI/BS 그룹핑) |
| `/wiki/standards/[id]` | 규격 상세 (마크다운 해설 + Infobox + 관련제품/문서) |
| `/documents` | PDF 문서 목록 |
| `/chat` | AI 채팅 (마크다운 답변 + 출처 상세 패널) |
| `/upload` | PDF 드래그앤드롭 업로드 + 자동분류 |
| `/search` | 통합 검색 (실시간 결과, 유형별 필터 탭) |

## API Routes (8개)
| 경로 | Method | 기능 |
|------|--------|------|
| `/api/chat` | POST | RAG 답변 (의도분류 → 하이브리드 검색 → Gemini 생성) |
| `/api/chat` | GET | 최근 대화 세션 20건 |
| `/api/search` | GET | 통합 검색 (제품/문서/PDF/규격, `?q=&type=`) |
| `/api/products` | GET/POST | 제품 목록 조회 / 등록 |
| `/api/products/[id]` | GET | 제품 상세 (물성, 규격 포함) |
| `/api/articles` | GET/POST | 위키 목록 조회 / 등록 (+임베딩 자동생성) |
| `/api/articles/[id]` | GET/PUT | 위키 상세 조회 / 편집 |
| `/api/upload` | POST | PDF 업로드 → 추출 → 분류 → 청킹 → 임베딩 |

## 사이드바 메뉴 구조
```
대시보드          /
제품 DB           /products
위키 문서         /wiki
PDF 문서          /documents
AI 질의응답       /chat
통합 검색         /search
규격/표준         /wiki/standards
▾ 카테고리
  ▾ 제품
    ● 그라우트     /products?category=grout
    ● 보수몰탈     /products?category=repair-mortar
    ● 바닥몰탈     /products?category=floor-mortar
    ● 타일용       /products?category=tile
  ● 시장/경쟁사    /wiki?category=market-analysis
  ● 국제규격       /wiki?category=international-standards
```

## 사용자 설정
| 기능 | 저장 |
|------|------|
| 다크/라이트/시스템 모드 | localStorage `vap-theme` |
| 폰트 크기 3단계 (13/14/16px) | localStorage `vap-fontsize` |
| 모바일 사이드바 (햄버거 메뉴) | - |

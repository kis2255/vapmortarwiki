# 데이터베이스

## DB 현황 (Supabase PostgreSQL 17)
| 테이블 | 건수 | 설명 |
|--------|------|------|
| categories | 8 | 그라우트/보수/방수/바닥/주입/타일/시장경쟁사/국제규격 |
| products | 15 | 삼표 특수몰탈 |
| product_properties | 27 | 물성 데이터 (압축강도, 팽창률 등) |
| product_standards | 14 | 제품-규격 연결 |
| standards | 13 | KS 7 + KDS 1 + EN 2 + ASTM 2 + ACI 1 + BS 1 |
| articles | 16 | 위키 문서 |
| article_products | - | 문서-제품 연결 |
| article_versions | - | 문서 버전 이력 |
| documents | 8 | 업로드 PDF |
| embeddings | ~390 | 벡터 (HNSW 인덱스, 768차원) |
| chat_sessions | - | AI 대화 세션 |
| chat_messages | - | AI 대화 메시지 |

## 엔티티 관계
```
Category ──< Product ──< ProductProperty
    │            │──< ProductStandard >── Standard
    │            │──< Document ──< Embedding
    │            └──< ArticleProduct
    └──< Article ──< Embedding
                └──< ArticleProduct
                └──< ArticleVersion
ChatSession ──< ChatMessage
```

## 삼표 특수몰탈 제품 (15종)

### 그라우트 (6종)
| 코드 | 제품명 | 28일 압축강도 | 규격 |
|------|--------|-------------|------|
| SG 45N | 범용 무수축 그라우트 | 48 MPa | KS F 4044, ASTM C1107 |
| SG 60P | 패드형 무수축 그라우트 | 63 MPa | KS F 4044, ASTM C1107 |
| SG 70S | PC슬리브용 무수축 그라우트 | 73 MPa | KS F 4044, ASTM C1107 |
| SG 70S+ | PC슬리브용 (개선형) | 75 MPa | KS F 4044 |
| SG 80ES | 초속경 무수축 그라우트 | 83 MPa (3h: 22) | KS F 4044, ASTM C1107 |
| SP-RAIL | 철도용 무수축 몰탈 | - | KS F 4044 |

### 보수몰탈 (1종)
| 코드 | 제품명 | 28일 압축강도 | 규격 |
|------|--------|-------------|------|
| SPPM 400 | 폴리머시멘트 보수몰탈 | 42 MPa | KS F 4042, KS F 2476 |

### 바닥몰탈 (4종)
| 코드 | 제품명 | 28일 압축강도 | 규격 |
|------|--------|-------------|------|
| SPSL 1040 | 자기수평 몰탈 | 30 MPa | KS F 4716 |
| SFM-1000 | 일반바닥용 몰탈 | - | - |
| SFM-2000 | 고급바닥용 몰탈 | - | - |
| SFM-2000H | 고강도바닥용 몰탈 | - | - |

### 타일용 (4종)
| 코드 | 제품명 |
|------|--------|
| ST-100 / ST-101 | 타일압착용 (백색/회색) |
| ST-2000 / ST-2001 | 타일줄눈용 (백색/회색) |

> 물성 데이터 "-" 항목은 사내 TDS 확보 후 보완 필요

## 규격/표준 (13건)
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

## 위키 문서 (16건)
| 분류 | 문서 | slug |
|------|------|------|
| 기술 | 폴리머 시멘트 모르타르 | polymer-cement-mortar |
| 기술 | 콘크리트 구조물 보수보강 개요 | concrete-repair-overview |
| 기술 | KS F 4042 규격 해설 | ks-f-4042-guide |
| 기술 | 콘크리트 탄산화(중성화) 메커니즘과 보수 | concrete-carbonation |
| 기술 | 염화물 유발 철근 부식과 보수 | chloride-corrosion |
| 기술 | 에폭시 vs 폴리우레탄 주입 비교 | epoxy-vs-polyurethane |
| 기술 | 셀프레벨링 몰탈 기술 | self-leveling-mortar |
| 기술 | 무수축 그라우트 - 철골 구조물 적용 | grout-steel-structure |
| 기술 | EN 1504 유럽 보수 표준 해설 | en-1504-guide |
| 기술 | 글로벌 주요 보수몰탈 제품 비교 | global-product-comparison |
| 시장 | 국내 보수보강 시장 동향 | domestic-market-trend |
| 시장 | 글로벌 특수몰탈 시장 동향 | global-market-trend |
| 경쟁사 | Saint-Gobain 건설화학 사업 분석 | saint-gobain-overview |
| 경쟁사 | Fosroc 보수몰탈 제품 라인업 | fosroc-product-lineup |
| 경쟁사 | Fosroc Conbextra 그라우트 분석 | fosroc-conbextra-grout |
| 경쟁사 | Weber 보수/방수/바닥 제품 분석 | weber-product-analysis |

## 업로드 PDF (8건, 경쟁사 TDS/가이드)
| 파일명 | 분류 | 출처 |
|--------|------|------|
| Sika_EN1504_Concrete_Repair_Guide.pdf | GUIDE | Sika |
| KR_Construction_Quality_Test_Standards.pdf | TEST_REPORT | 국토교통부 |
| Fosroc_Renderoc_S_TDS.pdf | TDS | Fosroc |
| Sika_Concrete_Repair_Site_Handbook.pdf | GUIDE | Sika |
| ARDEX_A38_TDS.pdf | TDS | ARDEX |
| Fosroc_Conbextra_GP_TDS.pdf | TDS | Fosroc |
| Weber_rep_R4_duo_TDS.pdf | TDS | Weber |
| SikaGrout-212_TDS.pdf | TDS | Sika |

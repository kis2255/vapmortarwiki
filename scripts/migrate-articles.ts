/**
 * Articles 마이그레이션 스크립트
 * Supabase에서 추출한 위키 문서 20건을 로컬 DB에 삽입
 * PDF 기반 대형 문서(8건)는 Supabase Storage URL 포함 → 추후 재생성 필요
 *
 * 실행: npx tsx scripts/migrate-articles.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const articles = [
  { id: "cmnbbtz52000rkem0cxw5jyr5", title: "폴리머 시멘트 모르타르", slug: "polymer-cement-mortar", categoryId: "cmnbbtw4m0000kem0mvtn3z14", tags: ["PCM","폴리머","보수재료","단면보수"], author: "시스템", content: `# 폴리머 시멘트 모르타르 (PCM)\n\n## 정의\n폴리머 시멘트 모르타르(Polymer Cement Mortar, PCM)는 시멘트 모르타르에 폴리머(고분자 수지)를 혼입하여 부착력, 방수성, 내구성을 향상시킨 복합 재료이다.\n\n## 종류\n### 재유화형 (Redispersible Polymer)\n- EVA(에틸렌-비닐 아세테이트) 계열\n- 분말 형태로 시멘트와 혼합\n\n### 수용성 (Aqueous Polymer)\n- SBR(스티렌-부타디엔 고무) 라텍스\n- 아크릴계 라텍스\n- 액상 형태로 혼합수 대체\n\n## 특성\n- 부착강도 향상 (일반 모르타르 대비 2~5배)\n- 방수성 및 내투수성 향상\n- 내화학성 향상\n- 동결융해 저항성 향상\n- 건조수축 감소\n\n## 적용 분야\n- 콘크리트 구조물 단면보수 (KS F 4042)\n- 방수 모르타르\n- 바닥 마감재\n- 타일 접착제\n\n## 관련 규격\n- **KS F 4042**: 콘크리트 구조물 보수용 폴리머 시멘트 모르타르\n- **KS F 2476**: 폴리머 시멘트 모르타르의 시험방법\n- **KS F 4916**: 시멘트 혼화용 폴리머` },
  { id: "cmnbbtzdh000tkem0l4k4td29", title: "콘크리트 구조물 보수보강 개요", slug: "concrete-repair-overview", categoryId: "cmnbbtw4m0000kem0mvtn3z14", tags: ["보수보강","콘크리트","열화","노후화"], author: "시스템", content: `# 콘크리트 구조물 보수보강 개요\n\n## 보수보강의 필요성\n콘크리트 구조물은 시간이 지남에 따라 열화가 진행된다. 국내 도로 교량의 17.7%가 이미 30년 이상 경과했으며, 2030년에는 51.3%에 달할 전망이다.\n\n## 열화 원인\n### 물리적 요인\n- 동결융해 반복\n- 마모 및 충격\n- 건조수축 균열\n\n### 화학적 요인\n- 중성화 (탄산화)\n- 염해 (해양 환경, 제설제)\n- 황산염 침식\n- 알칼리-골재 반응 (ASR)\n\n### 구조적 요인\n- 과하중\n- 설계/시공 결함\n- 지진 등 외력\n\n## 보수 공법 분류\n\n### 단면 보수\n열화된 콘크리트를 제거하고 보수재로 복원하는 공법.\n- 사용 재료: 폴리머 시멘트 모르타르 (KS F 4042)\n\n### 균열 보수\n균열에 보수재를 주입하여 구조물을 일체화하는 공법.\n- 사용 재료: 에폭시 주입재, 우레탄 주입재\n\n### 방수 보수\n콘크리트 표면에 방수층을 형성하는 공법.\n\n### 보강\n구조물의 내력을 향상시키는 공법.\n- 탄소섬유 보강 (CFRP)\n- 강판 접착 보강\n\n## 관련 규격\n- **KDS 14 31 05**: 콘크리트 구조물 보수보강 설계기준 (2024년 개정)\n- **KS F 4042**: 보수용 폴리머 시멘트 모르타르\n- **KS F 4044**: 무수축 그라우트` },
  { id: "cmnbbtzja000vkem0i4k0jhsd", title: "국내 보수보강 시장 동향", slug: "domestic-market-trend", categoryId: "cat-market", tags: ["시장동향","SOC","노후인프라","정부정책"], author: "시스템", content: `# 국내 보수보강 시장 동향\n\n## 인프라 노후화 현황\n\n### 도로 교량\n- 전체 교량 수: 약 36,000개소\n- 평균 사용연수: 20.4년\n- 30년 이상 노후 교량: 17.7% (2022년) → **51.3% (2030년 전망)**\n\n### 철도 시설물\n- 30년 이상 노후 철도시설물: 전체의 약 32% (1,407개소)\n\n## 정부 SOC 예산 (2026년)\n- **총 SOC 예산: 27.7조 원** (4년래 최대)\n- 국토교통부 예산: 62.8조 원 (역대 최대)\n\n## 시장 전망\n- 신규 건설 → **유지보수 중심 패러다임 전환** 가속화\n- 2030년까지 교량 절반 이상 노후화 → 보수보강 수요 급증` },
  { id: "cmnbbtzox000xkem0mawtd1am", title: "글로벌 특수몰탈 시장 동향", slug: "global-market-trend", categoryId: "cat-market", tags: ["글로벌","시장동향","M&A","Sika","BASF"], author: "시스템", content: `# 글로벌 특수몰탈 시장 동향\n\n## 시장 규모\n- 특수몰탈 전체: 2024년 USD 52억 → 2033년 USD 89억 (CAGR 6.1%)\n- 콘크리트 보수몰탈: 2025년 USD 25.2억 → 2031년 USD 35억\n\n## 주요 글로벌 플레이어\n- **Sika AG** (스위스): 2023년 MBCC Group(구 BASF) 인수. 시장 1위\n- **Saint-Gobain** (프랑스): 2024년 Fosroc 지분 60% 인수\n- **Mapei** (이탈리아): 폴리머 개질 몰탈 강점\n- **ARDEX** (독일): 바닥재/타일 접착제 전문` },
  { id: "cmnbbtzuf000zkem040d2m166", title: "KS F 4042 규격 해설", slug: "ks-f-4042-guide", categoryId: "cmnbbtw4m0000kem0mvtn3z14", tags: ["KS규격","KSF4042","폴리머시멘트모르타르","품질기준"], author: "시스템", content: `# KS F 4042 규격 해설\n\n## 규격 개요\n**KS F 4042 - 콘크리트 구조물 보수용 폴리머 시멘트 모르타르**\n\n## 품질 기준\n\n### 필수 시험 항목\n| 시험항목 | 기준값 | 시험방법 |\n|---------|--------|--------|\n| 압축강도(28일) | ≥40 MPa | KS F 2476 |\n| 휨강도(28일) | ≥7 MPa | KS F 2476 |\n| 부착강도 | ≥1.5 MPa | KS F 2476 |\n| 길이변화율 | ±0.15% | KS F 2476 |` },
  { id: "art-chloride", title: "염화물 유발 철근 부식과 보수", slug: "chloride-corrosion", categoryId: "cmnbbtw4m0000kem0mvtn3z14", tags: ["염해","철근부식","해양구조물"], author: "시스템", content: `# 염화물 유발 철근 부식\n\n## 메커니즘\nCl⁻ 이온이 철근 부동태피막을 국부적으로 파괴하여 부식 유발.\n\n## 보수 방법\n1. 부식억제제\n2. 표면 코팅\n3. 음극방식\n4. 단면보수 (SPPM 400)` },
  { id: "art-selflevel", title: "셀프레벨링 몰탈 기술", slug: "self-leveling-mortar", categoryId: "cmnbbtw8p0002kem0qk0i29yj", tags: ["셀프레벨링","바닥몰탈","에트린자이트"], author: "시스템", content: `# 셀프레벨링 몰탈 기술\n\n## 3원계 바인더\n- OPC (장기강도) + CAC (조기강도) + CaSO4 (수축보상)\n\n## 특성\n- 자체 중력으로 수평 형성\n- 시공 두께: 3~50mm\n- 보행 가능: 2~4시간\n- SPSL 1040: 유동성 240mm` },
  { id: "art-grout-steel", title: "무수축 그라우트 - 철골 구조물 적용", slug: "grout-steel-structure", categoryId: "cmnbbtwcl0004kem0naiisrue", tags: ["무수축","그라우트","철골","ASTMC1107"], author: "시스템", content: `# 무수축 그라우트 - 철골 구조물\n\n## 적용 부위\n1. 철골 베이스 플레이트\n2. 앵커 볼트 고정\n3. 기계 설비 기초\n4. PC 접합부\n5. 교량 받침\n\n## SG 45N\n- 28일 48 MPa, 유동성 8초\n- KS F 4044 / ASTM C1107 적합` },
  { id: "art-en1504", title: "EN 1504 유럽 콘크리트 보수 표준 해설", slug: "en-1504-guide", categoryId: "cat-intl-std", tags: ["EN1504","유럽표준","R등급","CE마킹"], author: "시스템", content: `# EN 1504 유럽 콘크리트 보수 표준 해설\n\n## EN 1504-3 보수몰탈 등급\n| 등급 | 분류 | 최소 압축강도 |\n|------|------|-------------|\n| R1 | 비구조 | ≥10 MPa |\n| R2 | 비구조 | ≥15 MPa |\n| R3 | 구조 | ≥25 MPa |\n| R4 | 구조 | ≥45 MPa |` },
  { id: "art-injection", title: "에폭시 vs 폴리우레탄 주입 비교", slug: "epoxy-vs-polyurethane", categoryId: "cmnbbtwcl0004kem0naiisrue", tags: ["에폭시","폴리우레탄","균열주입","비교"], author: "시스템", content: `# 에폭시 vs 폴리우레탄 주입 비교\n\n| 항목 | 에폭시 | 폴리우레탄 |\n|------|--------|----------|\n| 구조 강도 | 콘크리트 이상 | 복원 불가 |\n| 유연성 | 경질 | 연질/탄성 |\n| 습윤면 | 곤란 | 우수 |\n| 적합 용도 | 구조 균열 보수 | 방수/누수 차단 |` },
  { id: "art-carbonation", title: "콘크리트 탄산화(중성화) 메커니즘과 보수", slug: "concrete-carbonation", categoryId: "cmnbbtw4m0000kem0mvtn3z14", tags: ["탄산화","중성화","열화","철근부식"], author: "시스템", content: `# 콘크리트 탄산화(중성화)\n\n## 탄산화란?\nCO2가 콘크리트 내부로 침투하여 pH를 12.5에서 9.0 이하로 저하시키는 현상.\n\n## 화학 반응\n- Ca(OH)2 + CO2 → CaCO3 + H2O\n\n## 보수 방법\n1. 단면보수 (SPPM 400)\n2. 표면보호 (CO2 차단 코팅)\n3. 재알칼리화` },
  { id: "art-global-products", title: "글로벌 주요 보수몰탈 제품 비교", slug: "global-product-comparison", categoryId: "cat-market", tags: ["글로벌제품","Sika","Mapei","Fosroc","ARDEX"], author: "시스템", content: `# 글로벌 주요 보수몰탈 제품 비교\n\n## Sika\n- SikaTop-122 Plus: 28일 50 MPa\n- SikaGrout-212: 52 MPa\n\n## Fosroc Renderoc\n| 제품 | 등급 | 28일 강도 |\n|------|------|----------|\n| GP | R3 | 35~50 MPa |\n| S | R4 | 55 MPa |\n| LA55 | R4 | 60~74 MPa |` },
  { id: "art-sg-overview", title: "Saint-Gobain 건설화학 사업 분석", slug: "saint-gobain-overview", categoryId: "cat-market", tags: ["Saint-Gobain","Weber","Fosroc","건설화학","M&A"], author: "시스템", content: `# Saint-Gobain 건설화학 사업 분석\n\n## 기업 개요\n| 항목 | 내용 |\n|------|------|\n| 설립 | 1665년 (프랑스 파리) |\n| 2024년 매출 | €465.2억 |\n| 건설화학 부문 | €65억 |\n| 진출 국가 | 76개국 |\n\n## 건설화학 브랜드 포트폴리오\n| 브랜드 | 인수 시기 | 주요 영역 |\n|--------|----------|----------|\n| **Weber** | 기존 보유 | 기술 몰탈, 타일 접착제, 방수, 바닥재 |\n| **Chryso** | 2022년 | 콘크리트 혼화제 |\n| **Fosroc** | 2024~2025년 | 보수몰탈, 방수, 그라우트 |` },
  { id: "art-fosroc-products", title: "Fosroc 보수몰탈 제품 라인업", slug: "fosroc-product-lineup", categoryId: "cmnbbtw4m0000kem0mvtn3z14", tags: ["Fosroc","Renderoc","보수몰탈","EN1504","R4","경쟁사"], author: "시스템", content: `# Fosroc 보수몰탈 제품 라인업\n\n## Renderoc 시리즈\n| 제품명 | EN 1504 등급 | 28일 강도 |\n|--------|-------------|----------|\n| Renderoc GP | R3 | 35~40 MPa |\n| Renderoc S | **R4** | **55 MPa** |\n| Renderoc LA55 | **R4** | **60~74 MPa** |` },
  { id: "art-fosroc-grout", title: "Fosroc Conbextra 그라우트 제품 분석", slug: "fosroc-conbextra-grout", categoryId: "cmnbbtwcl0004kem0naiisrue", tags: ["Fosroc","Conbextra","그라우트","초고성능","경쟁사"], author: "시스템", content: `# Fosroc Conbextra 그라우트 제품 분석\n\n## Conbextra GP (범용)\n- 28일 강도: **65 MPa**\n\n## Conbextra BB92 (초고성능)\n- 28일 강도: **>100 MPa**` },
  { id: "art-weber-products", title: "Weber 보수/방수/바닥 제품 분석", slug: "weber-product-analysis", categoryId: null, tags: ["Weber","Saint-Gobain","보수몰탈","방수","바닥몰탈","경쟁사"], author: "시스템", content: `# Weber 보수/방수/바닥 제품 분석\n\n## weber.rep R4 duo (대표 제품)\n- EN 1504-3 R4 등급\n- 압축강도(28일): ≥45 MPa` },
  { id: "cmndmxtbi000oketgf5jvs2hp", title: "Saint-Gobain의 Fosroc 인수와 시장 영향", slug: "saint-gobain-fosroc-acquisition", categoryId: "cat-market", tags: ["경쟁사","Saint-Gobain","Fosroc","M&A","시장동향"], author: "마케팅팀", content: `# Saint-Gobain의 Fosroc 인수와 시장 영향\n\n## 인수 개요\n- **시기**: 2024년\n- **내용**: Saint-Gobain이 영국 Fosroc International 지분 60% 인수\n- **목적**: 건설화학 사업 강화\n\n## 경쟁 환경 변화\n- **Sika AG**: 2023년 MBCC Group 인수 → 시장 1위\n- **Saint-Gobain**: 2024년 Fosroc 인수 → 시장 2~3위 강화` },
  { id: "cmndmxspt000iketgjck9ov1b", title: "Saint-Gobain Weber 제품 분석", slug: "saint-gobain-weber-product-analysis", categoryId: "cat-market", tags: ["경쟁사","Saint-Gobain","Weber","제품분석"], author: "마케팅팀", content: `# Saint-Gobain Weber 제품 분석\n\n## 제품 라인업\n\n### 보수몰탈 (webercem)\n- HB40: R3 등급, ~45 MPa\n- Pyratop: 급결 보수, 6시간 교통 개방\n- ARC: R4 등급, 유동성 재타설\n\n### 그라우트 (webertec)\n- NSG+: ≥70 MPa\n- 301 HCS: ≥72 MPa\n\n### 방수 (weberdry)\n- Moistseal: 1액형 시멘트계\n- ES 119: 비투멘 방수막\n\n### 바닥 (weberfloor)\n- 1145: 셀프레벨링, 23.5 MPa` },
  { id: "cmndmxsyb000kketgsj9bc60d", title: "Saint-Gobain Weber 보수몰탈 기술자료 (영문 번역)", slug: "saint-gobain-weber-repair-mortar-tds", categoryId: "cat-market", tags: ["경쟁사","Saint-Gobain","Weber","TDS","보수몰탈","영문번역"], author: "마케팅팀", content: `# Saint-Gobain Weber 보수몰탈 기술자료 (영문 원문 번역)\n\n## webercem HB40\n- R3 모르타르\n- 수직면 75mm, 상향면 50mm\n\n## webercem Pyratop\n- 급결 보수 콘크리트\n- 6시간 교통 개방\n\n## webercem ARC\n- R4 등급\n- 유동성 재타설` },
  { id: "cmndmxt4z000mketgi5p0ljr9", title: "Saint-Gobain Weber 그라우트·방수·바닥 기술자료 (영문 번역)", slug: "saint-gobain-weber-grout-waterproof-floor-tds", categoryId: "cat-market", tags: ["경쟁사","Saint-Gobain","Weber","TDS","그라우트","방수","바닥","영문번역"], author: "마케팅팀", content: `# Saint-Gobain Weber 그라우트·방수·바닥 기술자료 (영문 원문 번역)\n\n## 그라우트\n- NSG+: ≥70 MPa\n- 301 HCS: ≥72 MPa\n\n## 방수\n- Moistseal: 2 kg/m² (2회 도포)\n- ES 119: 비투멘 방수막\n\n## 바닥\n- weberfloor 1145: 23.5 MPa, 4~10mm` },
];

async function main() {
  console.log(`\n위키 문서 ${articles.length}건 마이그레이션 시작\n`);

  for (const a of articles) {
    const excerpt = a.content.slice(0, 200);
    await prisma.article.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        title: a.title,
        slug: a.slug,
        content: a.content,
        excerpt,
        categoryId: a.categoryId,
        tags: a.tags,
        published: true,
        version: 1,
        author: a.author,
      },
    });
    console.log(`  ✓ ${a.title}`);
  }

  const count = await prisma.article.count();
  console.log(`\n✓ 완료! articles: ${count}건\n`);

  console.log(`\n⚠ PDF 기반 대형 문서 8건은 별도 재생성 필요:`);
  console.log(`  (Supabase Storage URL 포함 → 로컬 파일로 전환 후 재실행)`);
  console.log(`  npx tsx scripts/pdf-to-wiki-with-images.ts\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("경쟁사 데이터 시딩 시작...");

  // ─── 시장/경쟁사 카테고리 생성 ───
  const marketCat = await prisma.category.upsert({
    where: { slug: "market-analysis" },
    update: {},
    create: { name: "시장/경쟁사", slug: "market-analysis", order: 10 },
  });
  console.log("  시장/경쟁사 카테고리 생성");

  // ─── 기존 제품 카테고리 조회 ───
  const repairCat = await prisma.category.findUnique({ where: { slug: "repair-mortar" } });
  const waterproofCat = await prisma.category.findUnique({ where: { slug: "waterproof-mortar" } });
  const floorCat = await prisma.category.findUnique({ where: { slug: "floor-mortar" } });
  const groutCat = await prisma.category.findUnique({ where: { slug: "grout" } });

  if (!repairCat || !waterproofCat || !floorCat || !groutCat) {
    throw new Error("기본 카테고리가 없습니다. 먼저 seed.ts를 실행하세요.");
  }

  // ═══════════════════════════════════════════
  // Saint-Gobain Weber 제품 등록
  // ═══════════════════════════════════════════

  const sgProducts = [
    // ─── 보수몰탈 ───
    {
      code: "SG-HB40",
      name: "webercem HB40 (Saint-Gobain)",
      catId: repairCat.id,
      description:
        "Saint-Gobain Weber의 1액형 폴리머 개질 고부착 시멘트계 보수 모르타르. 구조 콘크리트 보수용으로 경량·저투수·고강도 특성을 가진다. BS EN 1504-3 R3 등급 적합.",
      usage: "구조 콘크리트 단면보수",
      scope: "주차장 상부슬래브, 교량 구조물, 기둥, 보 등 수직·상향면 콘크리트 보수",
      mixRatio: "분체 : 물 = 20kg : 약 3.6L",
      method:
        "1. 열화부 제거 및 하지처리\n2. 프라이머 도포 (weber 전용)\n3. webercem HB40 배합 후 충전\n4. 수직면 최대 75mm, 상향면 최대 50mm (거푸집 불필요)\n5. 습윤양생",
      curing: "습윤양생 권장",
      packaging: "20kg/포",
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥25 (R3)", value: "약 40~45", testMethod: "BS EN 12190" },
        { name: "부착강도", unit: "MPa", standard: "≥1.5", value: "≥1.5", testMethod: "BS EN 1542" },
        { name: "최대 시공두께(수직)", unit: "mm", standard: "-", value: "75", testMethod: "-" },
        { name: "최대 시공두께(상향)", unit: "mm", standard: "-", value: "50", testMethod: "-" },
      ],
    },
    {
      code: "SG-PYRATOP",
      name: "webercem Pyratop (Saint-Gobain)",
      catId: repairCat.id,
      description:
        "Saint-Gobain Weber의 2액형 수경성 시멘트계 급결 보수 콘크리트. 분체와 특수 골재를 물과 혼합하면 급결 고강도 콘크리트가 된다. 박층 접착 및 전체 깊이 보수 모두 가능.",
      usage: "급속 경화 콘크리트 보수",
      scope: "도로 포장 보수, 교통 개방 필요 현장, 최대 15m² 면적 보수",
      mixRatio: "분체 + 특수골재 + 물 (2파트 시스템)",
      method:
        "1. 열화부 제거\n2. 분체와 특수골재를 물과 혼합\n3. 25~30분 내 시공 (20°C 기준)\n4. 45분 내 경화\n5. 6시간 후 차량 통행 가능 (20°C)",
      curing: "6시간 후 교통 개방 (20°C), 18시간 (10°C)",
      packaging: "키트 단위",
      properties: [
        { name: "작업시간(20°C)", unit: "분", standard: "-", value: "25~30", testMethod: "-" },
        { name: "경화시간(20°C)", unit: "분", standard: "-", value: "45", testMethod: "-" },
        { name: "교통개방(20°C)", unit: "시간", standard: "-", value: "6", testMethod: "-" },
        { name: "교통개방(10°C)", unit: "시간", standard: "-", value: "18", testMethod: "-" },
        { name: "동결융해 저항성", unit: "-", standard: "적합", value: "적합", testMethod: "BS EN" },
      ],
    },
    {
      code: "SG-ARC",
      name: "webercem Advanced Repair Concrete (Saint-Gobain)",
      catId: repairCat.id,
      description:
        "Saint-Gobain Weber의 유동성 재타설 보수 콘크리트. 철근이 조밀한 구조 부재에 적합. BS EN 1504-3 R4 등급 적합 고강도 보수재.",
      usage: "유동성 구조 보수",
      scope: "철근 조밀 구간, 기둥 재킷팅, 보·슬래브 하면 보수",
      mixRatio: "유동성 타입 (물 첨가)",
      method:
        "1. 거푸집 설치\n2. 배합 후 유동성 확인\n3. 한 방향에서 연속 타설\n4. 양생",
      curing: "습윤양생",
      packaging: "25kg/포",
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥45 (R4)", value: "≥45", testMethod: "BS EN 12190" },
        { name: "분류", unit: "-", standard: "R4", value: "R4", testMethod: "BS EN 1504-3" },
      ],
    },

    // ─── 무수축 그라우트 ───
    {
      code: "SG-NSG",
      name: "webertec Non-Shrink Grout+ (Saint-Gobain)",
      catId: groutCat.id,
      description:
        "Saint-Gobain Weber의 프리믹스 시멘트계 무수축 그라우트. 기둥, 보, 프리캐스트 접합부 충전 및 콘크리트 보수용. 압축강도 70MPa 이상.",
      usage: "무수축 충전 / 기계기초",
      scope: "기둥·보·프리캐스트 접합부 충전, 기계기초, 앵커볼트 정착",
      mixRatio: "유동: 물 약 13~15% / 경화: 물 약 10~12%",
      method:
        "1. 거푸집 설치\n2. 물 첨가 후 배합 (유동/경화 선택)\n3. 한 방향에서 연속 타설\n4. 양생",
      curing: "습윤양생 3일 이상",
      packaging: "25kg/포",
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥60", value: "≥70", testMethod: "BS EN 12390" },
        { name: "밀도", unit: "g/cm³", standard: "-", value: "1.40", testMethod: "-" },
        { name: "가사시간", unit: "분", standard: "-", value: "120", testMethod: "-" },
        { name: "적용온도", unit: "°C", standard: "-", value: "+5 ~ +40", testMethod: "-" },
      ],
    },
    {
      code: "SG-301HCS",
      name: "webertec 301 HCS (Saint-Gobain)",
      catId: groutCat.id,
      description:
        "Saint-Gobain Weber의 고강도 무수축 그라우트. 고강도 콘크리트 구조물 보수, 앵커 정착, 공극 충전, 콘크리트 재킷팅, 교량 받침 등에 사용. 28일 압축강도 72MPa 이상.",
      usage: "고강도 무수축 충전",
      scope: "고강도 콘크리트 보수, 교량 받침(bearing), 앵커 정착, 콘크리트 재킷팅",
      mixRatio: "유동/소성 타입 선택",
      method:
        "1. 거푸집 설치 및 면처리\n2. 배합 (유동/소성 선택)\n3. 연속 타설\n4. 양생",
      curing: "습윤양생",
      packaging: "25kg/포",
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥60", value: "≥72", testMethod: "BS EN 12390" },
      ],
    },

    // ─── 방수몰탈 ───
    {
      code: "SG-MOISTSEAL",
      name: "weberdry Moistseal (Saint-Gobain)",
      catId: waterproofCat.id,
      description:
        "Saint-Gobain Weber의 1액형 시멘트계 방수 모르타르. 욕실·화장실 외벽, 콘크리트 벽체에 2회 도포로 양방향 차수 성능 제공. SMART 활성 방수 배리어.",
      usage: "시멘트계 침투방수",
      scope: "욕실·화장실 외벽, 콘크리트 벽체, 지하실",
      mixRatio: "분체 : 물 = 100 : 50~60 (중량비)",
      method:
        "1. 표면 청소 및 충분한 물 적심\n2. 분체에 물 50~60% 첨가 혼합\n3. 1차 도포 (1 kg/m²)\n4. 2차 도포 (1 kg/m²)\n5. 총 2 kg/m² 사용",
      curing: "자연양생",
      packaging: "20kg/포",
      properties: [
        { name: "소요량", unit: "kg/m²", standard: "-", value: "2.0 (2회)", testMethod: "-" },
        { name: "차수 방향", unit: "-", standard: "-", value: "양방향", testMethod: "-" },
      ],
    },
    {
      code: "SG-ES119",
      name: "weberdry ES 119 (Saint-Gobain)",
      catId: waterproofCat.id,
      description:
        "Saint-Gobain Weber의 수성 비투멘 방수막. 액상 도포형으로 근부(root) 저항성을 갖춘 기초·지하 방수용 제품.",
      usage: "비투멘계 도막방수",
      scope: "기초, 지하구조물, 옥상, 화분·녹화 구간 (근부 저항)",
      mixRatio: "원액 사용 (희석 불필요)",
      method:
        "1. 표면 청소 및 건조\n2. 프라이머 도포 (필요시)\n3. weberdry ES 119 롤러/브러시로 2회 도포\n4. 건조",
      curing: "자연건조",
      packaging: "통 단위",
      properties: [
        { name: "근부 저항성", unit: "-", standard: "적합", value: "적합", testMethod: "-" },
        { name: "제형", unit: "-", standard: "-", value: "수성 비투멘", testMethod: "-" },
      ],
    },

    // ─── 바닥몰탈 ───
    {
      code: "SG-FL1145",
      name: "weberfloor 1145 (Saint-Gobain)",
      catId: floorCat.id,
      description:
        "Saint-Gobain Weber의 셀프 레벨링 바닥 몰탈. PVC 타일, 마루, 바닥 타일 등 마감재 시공 전 바닥 평활화용. 4~10mm 두께 적용.",
      usage: "바닥 레벨링",
      scope: "주거, 병원, 상업시설 바닥 평활화 (마감재 하지)",
      mixRatio: "분체 : 물 = 25kg : 약 6L",
      method:
        "1. 바닥면 청소 및 프라이머 도포\n2. 배합 후 바닥에 타설\n3. 자기수평으로 평활화\n4. 권장 두께 4~5mm (최대 10mm)",
      curing: "보행 가능: 약 4시간, 마감재 시공: 24시간 후",
      packaging: "25kg/포 (Grey)",
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥20", value: "23.5", testMethod: "EN 13892" },
        { name: "휨강도(28일)", unit: "MPa", standard: "≥4", value: "7.0", testMethod: "EN 13892" },
        { name: "부착강도", unit: "MPa", standard: "≥0.5", value: "0.58", testMethod: "EN 13892" },
        { name: "소요량", unit: "kg/m²/mm", standard: "-", value: "1.7", testMethod: "-" },
        { name: "적용두께", unit: "mm", standard: "-", value: "4~10", testMethod: "-" },
        { name: "시공온도", unit: "°C", standard: "-", value: "15~40", testMethod: "-" },
      ],
    },
  ];

  // 제품 등록
  for (const p of sgProducts) {
    const product = await prisma.product.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        usage: p.usage,
        scope: p.scope,
        mixRatio: p.mixRatio,
        method: p.method,
        curing: p.curing,
        packaging: p.packaging,
      },
      create: {
        code: p.code,
        name: p.name,
        categoryId: p.catId,
        description: p.description,
        usage: p.usage,
        scope: p.scope,
        mixRatio: p.mixRatio,
        method: p.method,
        curing: p.curing,
        packaging: p.packaging,
      },
    });

    // 물성
    for (const prop of p.properties) {
      const propId = `${product.id}-${prop.name}`;
      await prisma.productProperty.upsert({
        where: { id: propId },
        update: { ...prop },
        create: { id: propId, productId: product.id, ...prop },
      });
    }

    // 검색용 임베딩 청크
    const productText = [
      `제품: ${p.name} (${p.code})`,
      `제조사: Saint-Gobain Weber (경쟁사)`,
      `설명: ${p.description}`,
      `용도: ${p.usage}`,
      `적용범위: ${p.scope}`,
      `배합비: ${p.mixRatio}`,
      `시공방법: ${p.method}`,
      `양생: ${p.curing}`,
      "물성 데이터:",
      ...p.properties.map((pr) => `  ${pr.name}: ${pr.value} ${pr.unit} (기준: ${pr.standard})`),
    ].join("\n");

    await prisma.embedding.upsert({
      where: { id: `emb-product-${product.id}` },
      update: { content: productText },
      create: {
        id: `emb-product-${product.id}`,
        content: productText,
        metadata: JSON.stringify({
          sourceType: "product",
          productCode: p.code,
          manufacturer: "Saint-Gobain Weber",
          isCompetitor: true,
        }),
        productId: product.id,
      },
    });
  }
  console.log(`  Saint-Gobain Weber 제품 ${sgProducts.length}개 등록`);

  // ═══════════════════════════════════════════
  // 위키 문서: Saint-Gobain Weber 분석
  // ═══════════════════════════════════════════

  const articles = [
    {
      title: "Saint-Gobain Weber 제품 분석",
      slug: "saint-gobain-weber-product-analysis",
      catSlug: "market-analysis",
      tags: ["경쟁사", "Saint-Gobain", "Weber", "제품분석"],
      content: `# Saint-Gobain Weber 제품 분석

## 기업 개요
Saint-Gobain(생고뱅)은 1665년 설립된 프랑스 다국적 건설자재 기업이다. Weber는 Saint-Gobain의 건설화학 브랜드로, 전 세계 60여 개국에서 몰탈·그라우트·방수·바닥재 등을 공급한다.

2024년 Saint-Gobain은 영국 Fosroc 지분 60%를 인수하여 건설화학 분야를 더욱 강화했다.

## 제품 라인업

### 1. 보수몰탈 (webercem 시리즈)

#### webercem HB40
- **유형**: 1액형 폴리머 개질 시멘트 보수 모르타르
- **규격**: BS EN 1504-3 R3
- **특징**: 수직면 최대 75mm, 상향면 50mm 시공 가능 (거푸집 불필요)
- **포장**: 20kg/포
- **용도**: 주차장 상부슬래브, 교량, 기둥·보 보수

#### webercem Pyratop
- **유형**: 2파트 급결 보수 콘크리트
- **특징**: 작업시간 25~30분, 경화 45분, 6시간 후 교통 개방 (20°C)
- **용도**: 도로 포장 긴급 보수, 교통 개방 필요 현장
- **최대 면적**: 15m²

#### webercem Advanced Repair Concrete
- **유형**: 유동성 재타설 보수 콘크리트
- **규격**: BS EN 1504-3 R4 (고강도)
- **특징**: 철근이 조밀한 구조 부재에 적합한 유동성 확보
- **용도**: 기둥 재킷팅, 보·슬래브 하면 보수

### 2. 무수축 그라우트 (webertec 시리즈)

#### webertec Non-Shrink Grout+
- **압축강도(28일)**: ≥70 MPa
- **가사시간**: 120분
- **용도**: 기둥·보·프리캐스트 접합부, 기계기초

#### webertec 301 HCS
- **압축강도(28일)**: ≥72 MPa
- **용도**: 고강도 콘크리트 보수, 교량 받침, 앵커 정착, 콘크리트 재킷팅

### 3. 방수 (weberdry 시리즈)

#### weberdry Moistseal
- **유형**: 1액형 시멘트계 방수 모르타르
- **소요량**: 2 kg/m² (2회 도포)
- **특징**: 양방향 차수 (SMART 활성 방수 배리어)
- **용도**: 욕실·화장실 외벽, 콘크리트 벽체

#### weberdry ES 119
- **유형**: 수성 비투멘 도막 방수
- **특징**: 근부(root) 저항성
- **용도**: 기초, 지하구조물, 옥상 녹화 구간

#### weberdry PUR SEAL / PUR COAT
- **유형**: 폴리우레탄 방수막
- **용도**: 옥상, 발코니, 교통면 (PUR COAT TRAFFIC)

#### weberdry ELASTO1/ELASTO2 RAPIDO
- **유형**: 엘라스토 시멘트 방수 쉬스
- **용도**: 기초, 지하 옹벽

### 4. 바닥몰탈 (weberfloor 시리즈)

#### weberfloor 1145
- **유형**: 셀프 레벨링 바닥 몰탈
- **압축강도(28일)**: 23.5 MPa (기준 ≥20)
- **휨강도(28일)**: 7.0 MPa (기준 ≥4)
- **적용두께**: 4~10mm (권장 4~5mm)
- **소요량**: 1.7 kg/m²/mm
- **용도**: 주거·병원·상업시설 바닥 평활화

#### weberfloor 550
- **유형**: 기계 또는 수동 시공 셀프 레벨링 시스템
- **용도**: 에폭시 코팅 하지용 평활면 확보

#### weberfloor level
- **유형**: 바닥 레벨링 컴파운드
- **특징**: 최대 30mm 깊이 시공, 초평활 마감
- **용도**: 카펫, 비닐, 리노, 마루 하지

## 유통 체계
- 자체 유통 + 대형 건설자재 유통업체 경유
- 아시아-태평양 지역: 싱가포르, 태국, 홍콩, 필리핀, 인도, 미얀마 등에 현지법인

## 기술 기준
- **보수몰탈**: BS EN 1504-3 (R3, R4 등급 체계)
- **그라우트**: BS EN 12390
- **바닥재**: EN 13892
- 유럽 EN 규격 중심 (한국 KS와 상이)

## 자사(삼표) 대비 분석

| 구분 | Saint-Gobain Weber | 삼표 VAP |
|------|-------------------|----------|
| 보수몰탈 등급 | BS EN 1504-3 (R3/R4) | KS F 4042 |
| 보수몰탈 강도 | HB40: ~45 MPa | RM-200: 68.5 MPa |
| 급결 보수재 | Pyratop: 6시간 개방 | RM-300S: 2시간 개방 |
| 그라우트 강도 | NSG+: ≥70 MPa | GR-100: 62.1 MPa |
| 방수 | Moistseal: 시멘트계 1액형 | WP-100: 시멘트계 침투형 |
| 바닥 레벨링 | FL1145: 23.5 MPa | FL-100: 35.8 MPa |

### 삼표 VAP 강점
- **RM-300S**: 2시간 교통 개방 (Pyratop 대비 4시간 빠름)
- **RM-200**: 압축강도 68.5 MPa로 Weber HB40(~45 MPa) 대비 월등
- **FL-100**: 바닥몰탈 압축강도 35.8 MPa로 weberfloor 1145(23.5 MPa) 대비 우수
- **국내 KS 인증 기반**: 국내 현장 적용에 유리

### Saint-Gobain Weber 강점
- 글로벌 유통 네트워크 (60개국+)
- 다양한 제품 라인업 (보수·방수·바닥·타일·단열 등)
- EN 규격 체계 → 해외 프로젝트 수주 시 유리
- 2024년 Fosroc 인수로 건설화학 사업 확대`,
    },
    {
      title: "Saint-Gobain Weber 보수몰탈 기술자료 (영문 번역)",
      slug: "saint-gobain-weber-repair-mortar-tds",
      catSlug: "market-analysis",
      tags: ["경쟁사", "Saint-Gobain", "Weber", "TDS", "보수몰탈", "영문번역"],
      content: `# Saint-Gobain Weber 보수몰탈 기술자료 (영문 원문 번역)

> 본 문서는 Saint-Gobain Weber의 영문 기술자료(TDS)를 한국어로 번역·정리한 것입니다.

## webercem HB40 — Technical Data Sheet (번역)

### 제품 설명 (Product Description)
webercem HB40는 1액형(single-component), 폴리머 개질(polymer-modified), 고부착(high build) 시멘트계 모르타르로, 구조 콘크리트 보수용으로 설계되었다. 경량(lightweight), 저투수(low permeability), 고강도(high strength) 모르타르를 제공하며 상향면(soffit) 및 수직면(vertical) 보수에 적합하다.

### 기술 분류 (Classification)
- **규격**: BS EN 1504-3
- **등급**: R3 모르타르
- **성분**: 섬유(fibres) 및 분무건조 아크릴 폴리머(spray dried acrylic polymer) 포함

### 적용 범위 (Applications)
- 주차장 상부슬래브 보수
- 교량 구조물 보수
- 기둥 및 보 보수
- 건축물 파사드 보수

### 시공 사양 (Application Specification)
| 항목 | 사양 |
|------|------|
| 수직면 최대 두께 | 75mm (거푸집 없이) |
| 상향면 최대 두께 | 50mm (거푸집 없이) |
| 포장 단위 | 20kg / 포 |
| 혼합 방법 | 기계 혼합 필수 |

### 자사 제품 비교
| 항목 | webercem HB40 | VAP RM-100 | VAP RM-200 |
|------|---------------|-----------|-----------|
| 분류 등급 | R3 (EN) | KS F 4042 | KS F 4042 |
| 압축강도(28일) | ~45 MPa | 52.3 MPa | 68.5 MPa |
| 최대 시공두께 | 75mm(수직) | 30mm(1회) | 40mm(1회) |
| 포장 | 20kg | 25kg | 25kg |

---

## webercem Pyratop — Technical Data Sheet (번역)

### 제품 설명
2파트(two-part) 수경성 시멘트계 보수 콘크리트. 분체와 특수 골재를 물과 혼합하면 급결(rapid setting), 고강도 초기강도(high early strength)의 콘크리트가 된다.

### 시공 성능 (Performance Data)
| 항목 | 20°C | 10°C |
|------|------|------|
| 작업시간 (Working Time) | 25~30분 | 연장 |
| 경화시간 (Set Time) | 45분 | 연장 |
| 교통개방 (Traffickable) | 6시간 | 18시간 |

### 특징
- 수축 보상형 (Shrinkage compensated)
- 동결융해 저항성 (Freeze/thaw resistant)
- 박층 접착 또는 전체 깊이 보수 가능
- 최대 보수 면적: 15m²

### 자사 제품 비교 (급결 보수재)
| 항목 | webercem Pyratop | VAP RM-300S |
|------|-----------------|-------------|
| 3시간 압축강도 | 미공개 | 22.1 MPa |
| 교통개방시간 | 6시간 (20°C) | 2시간 |
| 28일 압축강도 | 미공개 | 55.0 MPa |

> **VAP RM-300S가 교통개방 시간에서 압도적 우위 (2시간 vs 6시간)**

---

## webercem Advanced Repair Concrete — Technical Data Sheet (번역)

### 제품 설명
유동성(flowing) 재타설(recasting) 보수 콘크리트. 철근이 조밀한(congested reinforcement) 구조 부재에 이상적. BS EN 1504-3 R4 등급 적합.

### 주요 특성
- R4 등급: 압축강도 ≥45 MPa
- 유동성 타입: 거푸집 타설 방식
- 변형: CP (음극방식 호환) 타입 별도 존재

### 적용
- 기둥 재킷팅 (Column jacketing)
- 보 하면 보수
- 음극방식(cathodic protection) 적용 구조물 (CP 타입)`,
    },
    {
      title: "Saint-Gobain Weber 그라우트·방수·바닥 기술자료 (영문 번역)",
      slug: "saint-gobain-weber-grout-waterproof-floor-tds",
      catSlug: "market-analysis",
      tags: ["경쟁사", "Saint-Gobain", "Weber", "TDS", "그라우트", "방수", "바닥", "영문번역"],
      content: `# Saint-Gobain Weber 그라우트·방수·바닥 기술자료 (영문 원문 번역)

> 본 문서는 Saint-Gobain Weber의 영문 기술자료(TDS)를 한국어로 번역·정리한 것입니다.

## 그라우트 제품

### webertec Non-Shrink Grout+ (번역)

#### 제품 설명
프리믹스(pre-mixed) 시멘트계 무수축 몰탈. 기둥, 보, 프리캐스트 접합부의 그라우팅 및 콘크리트 보수에 적합.

#### 기술 데이터 (Technical Data)
| 항목 (Property) | 값 (Value) |
|-----------------|-----------|
| 압축강도 (Compressive Strength) | >700 ksc (≈70 MPa) |
| 밀도 (Density) | 1.40 g/cm³ |
| 가사시간 (Pot Life) | 120분 |
| 적용온도 (Application Temp.) | +5°C ~ +40°C |

#### 자사 비교
| 항목 | webertec NSG+ | VAP GR-100 |
|------|--------------|-----------|
| 압축강도(28일) | ≥70 MPa | 62.1 MPa |
| 1일 강도 | 미공개 | 28.3 MPa |
| 팽창률 | 미공개 | 0.08% |
| 유동성 | 미공개 | 7.2초 |

---

### webertec 301 HCS — High Strength Grout (번역)

#### 제품 설명
무수축 고강도 그라우트. 고강도 콘크리트 구조물 보수용.

#### 주요 사양
- 압축강도(28일): >72 MPa
- 용도: 앵커 정착(anchoring rebar), 공극 충전(filling voids), 콘크리트 재킷팅(jacketing), 교량 받침(bridge bearing)
- 유동성/소성 선택 가능

---

## 방수 제품

### weberdry Moistseal (번역)

#### 제품 설명
간편한 1액형(single-component) 방수 모르타르. 욕실·화장실 외벽 및 콘크리트 벽체에 적용. 2회 도포 시 양방향(both directions) 차수 성능의 SMART 활성 방수 배리어 형성.

#### 시공 데이터
| 항목 | 값 |
|------|---|
| 소요량 | 2 kg/m² (2회 도포) |
| 배합비 | 분체 중량의 50~60% 물 첨가 |
| 도포 횟수 | 2회 |

#### 자사 비교
| 항목 | weberdry Moistseal | VAP WP-100 |
|------|-------------------|-----------|
| 유형 | 1액형 시멘트계 | 시멘트계 침투형 |
| 소요량 | 2 kg/m² | 약 2 kg/m² (2mm 도포) |
| 압축강도 | 미공개 | 38.2 MPa |
| 투수량 | 미공개 | 0.5 mL (기준 ≤2) |
| 부착강도 | 미공개 | 1.2 MPa |

> **VAP WP-100은 물성 데이터를 투명하게 공개하여 신뢰성 우위 확보**

---

### weberdry ES 119 (번역)

#### 제품 설명
액상 도포형(liquid applied), 수성(water-based), 비투멘(bitumen) 방수막. 근부(root) 저항성 보유.

#### 적용
- 기초 방수
- 지하 구조물
- 옥상 녹화 구간 (식물 근부 저항)

---

### weberdry PUR SEAL / PUR COAT 시리즈

| 제품명 | 유형 | 용도 |
|--------|------|------|
| PUR SEAL | 폴리우레탄 방수막 | 옥상, 발코니 |
| PUR COAT | 폴리우레탄 코팅 | 방습 배리어 |
| PUR COAT TRAFFIC | 교통용 PU 코팅 | 도로 포장면 |

---

## 바닥 제품

### weberfloor 1145 — Self-Leveling Compound (번역)

#### 제품 설명
PVC 타일, 마루, 바닥 타일 등 바닥 마감재 시공 전 바닥 레벨링용 프리믹스 몰탈. 4~10mm 두께 적용.

#### 기술 데이터 (Technical Data)
| 항목 (Property) | 기준 (Standard) | 시험 결과 (Result) |
|-----------------|----------------|------------------|
| 압축강도 (Compressive Str.) | ≥20 N/mm² | 23.52 N/mm² |
| 휨강도 (Flexural Str.) | ≥4 N/mm² | 7.0 N/mm² |
| 부착강도 (Bond Str.) | ≥0.5 N/mm² | 0.58 N/mm² |
| 콘크리트 부착 (Bond to Concrete) | - | 0.9 N/mm² |
| 소요량 (Consumption) | - | 1.7 kg/m²/mm |
| 적용두께 (Thickness) | - | 4~10mm (권장 4~5mm) |
| 시공온도 (Service Temp.) | - | 15~40°C |

#### 자사 비교
| 항목 | weberfloor 1145 | VAP FL-100 |
|------|----------------|-----------|
| 압축강도(28일) | 23.5 MPa | 35.8 MPa |
| 휨강도(28일) | 7.0 MPa | 7.2 MPa |
| 유동성 | 미공개 | 240mm |

> **VAP FL-100은 압축강도에서 약 52% 우위 (35.8 vs 23.5 MPa)**`,
    },
    {
      title: "Saint-Gobain의 Fosroc 인수와 시장 영향",
      slug: "saint-gobain-fosroc-acquisition",
      catSlug: "market-analysis",
      tags: ["경쟁사", "Saint-Gobain", "Fosroc", "M&A", "시장동향"],
      content: `# Saint-Gobain의 Fosroc 인수와 시장 영향

## 인수 개요
- **시기**: 2024년
- **내용**: Saint-Gobain이 영국 Fosroc International 지분 60% 인수
- **목적**: 건설화학(Construction Chemicals) 사업 강화

## Fosroc International
- 본사: 영국
- 사업영역: 콘크리트 보수·보강, 방수, 그라우트, 혼화제
- 주요 시장: 중동, 동남아시아, 인도, 아프리카
- 한국 진출: 포스록코리아 (구 포스록코리아건설화학)

## 시장 영향

### 긍정적 영향 (Saint-Gobain 측)
- Weber(몰탈·타일) + Fosroc(콘크리트 보수·혼화제) 시너지
- 아시아·중동 시장 점유율 확대
- 기술 포트폴리오 확대 (에폭시, 폴리우레탄 계열 보강)

### 경쟁 환경 변화
- **Sika AG**: 2023년 MBCC Group(구 BASF CC) 인수 → 시장 1위
- **Saint-Gobain**: 2024년 Fosroc 인수 → 시장 2~3위 강화
- 상위 글로벌 기업의 M&A를 통한 시장 집중 가속화

### 국내 시장 시사점
- Fosroc 한국 법인(포스록코리아) + Weber 라인업 통합 가능성
- 글로벌 프로젝트에서 Saint-Gobain 사양 지정 확대 우려
- **삼표 대응**: 국내 KS 인증 기반 경쟁력, 맞춤형 기술지원, 가격 경쟁력

## 관련 글로벌 M&A 현황

| 시기 | 인수자 | 피인수자 | 비고 |
|------|--------|---------|------|
| 2023 | Sika AG | MBCC Group (구 BASF CC) | 시장 1위 |
| 2024 | Saint-Gobain | Fosroc (60%) | 건설화학 강화 |
| 2022 | Sika AG | MBCC Group 추진 발표 | CHF 5.5B |

## 시사점
글로벌 건설화학 시장이 상위 기업 중심으로 재편되고 있다. 삼표는 국내 KS 인증 기반의 품질 경쟁력과 현장 밀착 기술지원을 차별화 전략으로 삼아야 한다.`,
    },
  ];

  for (const a of articles) {
    const catId = a.catSlug
      ? (await prisma.category.findUnique({ where: { slug: a.catSlug } }))?.id || null
      : null;

    const article = await prisma.article.upsert({
      where: { slug: a.slug },
      update: { content: a.content, tags: a.tags },
      create: {
        title: a.title,
        slug: a.slug,
        content: a.content,
        excerpt: a.content.slice(0, 200),
        categoryId: catId,
        tags: a.tags,
        published: true,
        author: "마케팅팀",
      },
    });

    // 검색용 청크
    const chunks = a.content.split(/\n(?=##?\s)/).filter((c) => c.trim().length > 30);
    for (let i = 0; i < chunks.length; i++) {
      await prisma.embedding.upsert({
        where: { id: `emb-article-${article.id}-${i}` },
        update: { content: chunks[i] },
        create: {
          id: `emb-article-${article.id}-${i}`,
          content: chunks[i],
          metadata: JSON.stringify({
            sourceType: "article",
            title: a.title,
            isCompetitor: true,
          }),
          articleId: article.id,
        },
      });
    }
  }
  console.log(`  위키 문서 ${articles.length}개 등록`);

  console.log("\n경쟁사 데이터 시딩 완료!");
  console.log(`  시장/경쟁사 카테고리: 1개`);
  console.log(`  Saint-Gobain Weber 제품: ${sgProducts.length}개`);
  console.log(`  위키 분석 문서: ${articles.length}개`);
  console.log(`  검색 청크: 자동 생성됨`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

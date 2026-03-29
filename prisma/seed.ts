import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // ─── 카테고리 ───
  const cats = {
    repair: await prisma.category.upsert({
      where: { slug: "repair-mortar" },
      update: {},
      create: { name: "보수몰탈", slug: "repair-mortar", order: 1 },
    }),
    waterproof: await prisma.category.upsert({
      where: { slug: "waterproof-mortar" },
      update: {},
      create: { name: "방수몰탈", slug: "waterproof-mortar", order: 2 },
    }),
    floor: await prisma.category.upsert({
      where: { slug: "floor-mortar" },
      update: {},
      create: { name: "바닥몰탈", slug: "floor-mortar", order: 3 },
    }),
    injection: await prisma.category.upsert({
      where: { slug: "injection" },
      update: {},
      create: { name: "주입재", slug: "injection", order: 4 },
    }),
    grout: await prisma.category.upsert({
      where: { slug: "grout" },
      update: {},
      create: { name: "그라우트", slug: "grout", order: 5 },
    }),
  };
  console.log("  카테고리 5개 생성");

  // ─── KS 규격 ───
  const stds = {
    ksf4042: await prisma.standard.upsert({
      where: { code: "KS F 4042" },
      update: {},
      create: { code: "KS F 4042", name: "콘크리트 구조물 보수용 폴리머 시멘트 모르타르", description: "콘크리트 구조물의 단면 보수에 사용하는 폴리머 시멘트 모르타르의 품질 기준", category: "KS" },
    }),
    ksf4044: await prisma.standard.upsert({
      where: { code: "KS F 4044" },
      update: {},
      create: { code: "KS F 4044", name: "수경성 시멘트 무수축 그라우트", description: "수경성 시멘트를 결합재로 하는 무수축 그라우트재의 품질 및 시험 방법", category: "KS" },
    }),
    ksf2476: await prisma.standard.upsert({
      where: { code: "KS F 2476" },
      update: {},
      create: { code: "KS F 2476", name: "폴리머 시멘트 모르타르의 시험방법", description: "폴리머 시멘트 모르타르의 각종 물성 시험 방법 규정", category: "KS" },
    }),
    ksf4716: await prisma.standard.upsert({
      where: { code: "KS F 4716" },
      update: {},
      create: { code: "KS F 4716", name: "시멘트계 바탕 바름재", description: "시멘트계 바탕(하지) 바름재의 품질 기준", category: "KS" },
    }),
    kds143105: await prisma.standard.upsert({
      where: { code: "KDS 14 31 05" },
      update: {},
      create: { code: "KDS 14 31 05", name: "콘크리트 구조물 보수보강 설계기준", description: "콘크리트 구조물 보수보강 설계기준 (2024년 개정)", category: "KDS" },
    }),
    ksf4916: await prisma.standard.upsert({
      where: { code: "KS F 4916" },
      update: {},
      create: { code: "KS F 4916", name: "시멘트 혼화용 폴리머", description: "시멘트 모르타르 및 콘크리트에 혼화하는 폴리머(라텍스 등)의 품질 기준", category: "KS" },
    }),
    ksf2624: await prisma.standard.upsert({
      where: { code: "KS F 2624" },
      update: {},
      create: { code: "KS F 2624", name: "균열 보수용 직접 주입재의 내피로 성능 시험방법", description: "균열 보수용 주입재의 피로 성능 평가 시험 방법", category: "KS" },
    }),
  };
  console.log("  규격 7개 생성");

  // ─── 제품 + 물성 데이터 ───
  const products = [
    {
      code: "RM-100", name: "VAP 보수몰탈 RM-100", catId: cats.repair.id,
      description: "콘크리트 구조물 단면보수용 폴리머 시멘트 모르타르. KS F 4042 인증 제품.",
      usage: "콘크리트 구조물 단면보수", scope: "교량, 터널, 건축물, 옹벽 등 콘크리트 구조물의 열화부 단면 복원",
      mixRatio: "분체 : 물 = 25kg : 4L (1 : 0.16)",
      method: "1. 하지처리: 열화부 제거 및 철근 방청처리\n2. 프라이머: VAP 프라이머 도포\n3. 충전/미장: RM-100 배합 후 충전 (1회 최대 30mm)\n4. 양생: 습윤양생 3일 이상",
      curing: "습윤양생 3일 이상, 기온 5°C 이상", packaging: "25kg/포",
      standards: [stds.ksf4042.id],
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥40", value: "52.3", testMethod: "KS F 2476", passed: true },
        { name: "휨강도(28일)", unit: "MPa", standard: "≥7", value: "9.8", testMethod: "KS F 2476", passed: true },
        { name: "부착강도", unit: "MPa", standard: "≥1.5", value: "2.1", testMethod: "KS F 2476", passed: true },
        { name: "길이변화율", unit: "%", standard: "±0.15", value: "0.03", testMethod: "KS F 2476", passed: true },
      ],
    },
    {
      code: "RM-200", name: "VAP 보수몰탈 RM-200", catId: cats.repair.id,
      description: "고강도 폴리머 시멘트 모르타르. 해양 환경 및 극한 조건 대응용.",
      usage: "고강도 단면보수", scope: "해양 구조물, 화학 플랜트, 고속도로 교량 등 고내구성 요구 구조물",
      mixRatio: "분체 : 물 = 25kg : 3.5L", method: "1. 하지처리: 워터젯 또는 샌드블라스팅\n2. 프라이머: VAP 프라이머-H 도포\n3. 충전: RM-200 배합 후 충전 (1회 최대 40mm)\n4. 양생: 습윤양생 5일 이상",
      curing: "습윤양생 5일 이상", packaging: "25kg/포",
      standards: [stds.ksf4042.id],
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥40", value: "68.5", testMethod: "KS F 2476", passed: true },
        { name: "휨강도(28일)", unit: "MPa", standard: "≥7", value: "12.3", testMethod: "KS F 2476", passed: true },
        { name: "부착강도", unit: "MPa", standard: "≥1.5", value: "2.8", testMethod: "KS F 2476", passed: true },
        { name: "길이변화율", unit: "%", standard: "±0.15", value: "0.02", testMethod: "KS F 2476", passed: true },
        { name: "동결융해 저항성", unit: "상대동탄성계수 %", standard: "≥80", value: "92", testMethod: "KS F 2476", passed: true },
      ],
    },
    {
      code: "RM-300S", name: "VAP 초속경 보수몰탈 RM-300S", catId: cats.repair.id,
      description: "초속경 경화 타입. 2시간 내 교통 개방 가능.",
      usage: "긴급 보수 / 교통 개방 필요 현장", scope: "도로 포장 긴급 보수, 교량 신축이음부, 교통량 많은 구간",
      mixRatio: "분체 : 물 = 25kg : 3L", method: "1. 하지처리: 열화부 제거\n2. 프라이머: 생략 가능 (접착력 확보됨)\n3. 충전: RM-300S 배합 후 신속 시공\n4. 양생: 2시간 후 교통 개방 가능",
      curing: "2시간 초기 경화, 1일 소요강도 발현", packaging: "25kg/포",
      standards: [stds.ksf4042.id],
      properties: [
        { name: "압축강도(3시간)", unit: "MPa", standard: "≥15", value: "22.1", testMethod: "KS F 2476", passed: true },
        { name: "압축강도(1일)", unit: "MPa", standard: "≥30", value: "41.5", testMethod: "KS F 2476", passed: true },
        { name: "압축강도(28일)", unit: "MPa", standard: "≥40", value: "55.0", testMethod: "KS F 2476", passed: true },
        { name: "부착강도", unit: "MPa", standard: "≥1.5", value: "1.9", testMethod: "KS F 2476", passed: true },
      ],
    },
    {
      code: "WP-100", name: "VAP 방수몰탈 WP-100", catId: cats.waterproof.id,
      description: "시멘트계 방수 모르타르. 지하 구조물 및 수조 방수에 적합.",
      usage: "침투방수 / 지하방수", scope: "지하주차장, 지하실, 수조, 정수장, 하수처리장",
      mixRatio: "분체 : 물 = 25kg : 5L", method: "1. 표면 청소 및 충분한 물 적심\n2. WP-100 배합\n3. 솔 또는 뿜칠로 2회 도포 (1회 1mm, 총 2mm)\n4. 양생: 습윤양생 2일",
      curing: "습윤양생 2일 이상", packaging: "25kg/포",
      standards: [],
      properties: [
        { name: "투수량", unit: "mL", standard: "≤2", value: "0.5", testMethod: "KS F 4919", passed: true },
        { name: "부착강도", unit: "MPa", standard: "≥0.7", value: "1.2", testMethod: "KS F 4919", passed: true },
        { name: "압축강도(28일)", unit: "MPa", standard: "≥25", value: "38.2", testMethod: "KS F 2405", passed: true },
      ],
    },
    {
      code: "FL-100", name: "VAP 바닥몰탈 FL-100", catId: cats.floor.id,
      description: "셀프 레벨링 바닥 몰탈. 공장, 물류센터, 주차장 바닥 마감용.",
      usage: "바닥 레벨링 / 마감", scope: "공장 바닥, 물류센터, 주차장, 상업시설 바닥",
      mixRatio: "분체 : 물 = 25kg : 5.5L", method: "1. 바닥면 청소 및 프라이머 도포\n2. FL-100 배합 (자기수평성 확인)\n3. 바닥에 타설 후 자연 레벨링\n4. 디에어링 롤러로 기포 제거",
      curing: "24시간 보행 가능, 7일 완전 경화", packaging: "25kg/포",
      standards: [],
      properties: [
        { name: "압축강도(28일)", unit: "MPa", standard: "≥25", value: "35.8", testMethod: "KS L 5105", passed: true },
        { name: "휨강도(28일)", unit: "MPa", standard: "≥5", value: "7.2", testMethod: "KS L 5105", passed: true },
        { name: "유동성", unit: "mm", standard: "≥200", value: "240", testMethod: "자체기준", passed: true },
      ],
    },
    {
      code: "GR-100", name: "VAP 무수축 그라우트 GR-100", catId: cats.grout.id,
      description: "무수축 시멘트 그라우트. 기계기초, 앵커볼트 정착, 기둥 이음부 충전.",
      usage: "무수축 충전", scope: "기계기초, 철골 베이스, 앵커볼트 정착, PC 부재 접합부",
      mixRatio: "분체 : 물 = 25kg : 3.25L (유동성) / 2.75L (경화형)", method: "1. 거푸집 설치 및 면처리\n2. GR-100 배합 (유동타입/경화타입 선택)\n3. 한 방향에서 연속 타설 (공기 혼입 방지)\n4. 양생: 습윤양생 3일",
      curing: "습윤양생 3일 이상", packaging: "25kg/포",
      standards: [stds.ksf4044.id],
      properties: [
        { name: "압축강도(1일)", unit: "MPa", standard: "≥20", value: "28.3", testMethod: "KS F 4044", passed: true },
        { name: "압축강도(28일)", unit: "MPa", standard: "≥45", value: "62.1", testMethod: "KS F 4044", passed: true },
        { name: "팽창률", unit: "%", standard: "0~0.3", value: "0.08", testMethod: "KS F 4044", passed: true },
        { name: "유동성", unit: "초", standard: "4~12", value: "7.2", testMethod: "KS F 4044", passed: true },
      ],
    },
    {
      code: "IJ-100", name: "VAP 주입재 IJ-100", catId: cats.injection.id,
      description: "에폭시계 균열 주입재. 미세균열부터 구조균열까지 대응.",
      usage: "균열 보수 / 주입", scope: "콘크리트 균열 보수 (0.2mm~5mm), 구조물 일체화",
      mixRatio: "주제 : 경화제 = 2 : 1 (중량비)", method: "1. 균열면 청소 및 주입 좌 부착\n2. 균열 실링 (에폭시 퍼티)\n3. IJ-100 저압 주입 (0.2~0.5 MPa)\n4. 경화 후 주입 좌 및 실링 제거",
      curing: "경화시간 약 8시간 (20°C)", packaging: "2kg 세트 (주제+경화제)",
      standards: [stds.ksf2624.id],
      properties: [
        { name: "인장강도", unit: "MPa", standard: "≥30", value: "42.5", testMethod: "ASTM D 638", passed: true },
        { name: "압축강도", unit: "MPa", standard: "≥60", value: "78.3", testMethod: "ASTM D 695", passed: true },
        { name: "부착강도", unit: "MPa", standard: "≥3.0", value: "4.2", testMethod: "KS F 4923", passed: true },
        { name: "점도(25°C)", unit: "mPa·s", standard: "200~500", value: "320", testMethod: "자체기준", passed: true },
      ],
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code, name: p.name, categoryId: p.catId,
        description: p.description, usage: p.usage, scope: p.scope,
        mixRatio: p.mixRatio, method: p.method, curing: p.curing, packaging: p.packaging,
      },
    });

    // 규격 연결
    for (const stdId of p.standards) {
      await prisma.productStandard.upsert({
        where: { productId_standardId: { productId: product.id, standardId: stdId } },
        update: {},
        create: { productId: product.id, standardId: stdId },
      });
    }

    // 물성
    for (const prop of p.properties) {
      const propId = `${product.id}-${prop.name}`;
      await prisma.productProperty.upsert({
        where: { id: propId },
        update: {},
        create: { id: propId, productId: product.id, ...prop },
      });
    }

    // 제품 정보를 검색용 청크로 저장
    const productText = [
      `제품: ${p.name} (${p.code})`,
      `설명: ${p.description}`,
      `용도: ${p.usage}`,
      `적용범위: ${p.scope}`,
      `배합비: ${p.mixRatio}`,
      `시공방법: ${p.method}`,
      `양생: ${p.curing}`,
      "물성 데이터:",
      ...p.properties.map(pr => `  ${pr.name}: ${pr.value} ${pr.unit} (기준: ${pr.standard})`),
    ].join("\n");

    await prisma.embedding.upsert({
      where: { id: `emb-product-${product.id}` },
      update: { content: productText },
      create: {
        id: `emb-product-${product.id}`,
        content: productText,
        metadata: JSON.stringify({ sourceType: "product", productCode: p.code }),
        productId: product.id,
      },
    });
  }
  console.log(`  제품 ${products.length}개 생성 (물성 데이터 + 검색 청크 포함)`);

  // ─── 위키 문서 ───
  const articles = [
    {
      title: "폴리머 시멘트 모르타르", slug: "polymer-cement-mortar", catSlug: "repair-mortar",
      tags: ["PCM", "폴리머", "보수재료", "단면보수"],
      content: `# 폴리머 시멘트 모르타르 (PCM)

## 정의
폴리머 시멘트 모르타르(Polymer Cement Mortar, PCM)는 시멘트 모르타르에 폴리머(고분자 수지)를 혼입하여 부착력, 방수성, 내구성을 향상시킨 복합 재료이다.

## 종류
### 재유화형 (Redispersible Polymer)
- EVA(에틸렌-비닐 아세테이트) 계열
- 분말 형태로 시멘트와 혼합

### 수용성 (Aqueous Polymer)
- SBR(스티렌-부타디엔 고무) 라텍스
- 아크릴계 라텍스
- 액상 형태로 혼합수 대체

## 특성
- 부착강도 향상 (일반 모르타르 대비 2~5배)
- 방수성 및 내투수성 향상
- 내화학성 향상
- 동결융해 저항성 향상
- 건조수축 감소

## 적용 분야
- 콘크리트 구조물 단면보수 (KS F 4042)
- 방수 모르타르
- 바닥 마감재
- 타일 접착제

## 관련 규격
- **KS F 4042**: 콘크리트 구조물 보수용 폴리머 시멘트 모르타르
- **KS F 2476**: 폴리머 시멘트 모르타르의 시험방법
- **KS F 4916**: 시멘트 혼화용 폴리머`,
    },
    {
      title: "콘크리트 구조물 보수보강 개요", slug: "concrete-repair-overview", catSlug: "repair-mortar",
      tags: ["보수보강", "콘크리트", "열화", "노후화"],
      content: `# 콘크리트 구조물 보수보강 개요

## 보수보강의 필요성
콘크리트 구조물은 시간이 지남에 따라 열화가 진행된다. 국내 도로 교량의 17.7%가 이미 30년 이상 경과했으며, 2030년에는 51.3%에 달할 전망이다.

## 열화 원인
### 물리적 요인
- 동결융해 반복
- 마모 및 충격
- 건조수축 균열

### 화학적 요인
- 중성화 (탄산화)
- 염해 (해양 환경, 제설제)
- 황산염 침식
- 알칼리-골재 반응 (ASR)

### 구조적 요인
- 과하중
- 설계/시공 결함
- 지진 등 외력

## 보수 공법 분류

### 단면 보수
열화된 콘크리트를 제거하고 보수재로 복원하는 공법.
- 사용 재료: 폴리머 시멘트 모르타르 (KS F 4042)
- VAP 제품: RM-100, RM-200, RM-300S

### 균열 보수
균열에 보수재를 주입하여 구조물을 일체화하는 공법.
- 사용 재료: 에폭시 주입재, 우레탄 주입재
- VAP 제품: IJ-100

### 방수 보수
콘크리트 표면에 방수층을 형성하는 공법.
- 사용 재료: 시멘트계 방수제, 도막 방수제
- VAP 제품: WP-100

### 보강
구조물의 내력을 향상시키는 공법.
- 탄소섬유 보강 (CFRP)
- 강판 접착 보강
- 프리스트레싱 보강

## 관련 규격
- **KDS 14 31 05**: 콘크리트 구조물 보수보강 설계기준 (2024년 개정)
- **KS F 4042**: 보수용 폴리머 시멘트 모르타르
- **KS F 4044**: 무수축 그라우트`,
    },
    {
      title: "국내 보수보강 시장 동향", slug: "domestic-market-trend", catSlug: null,
      tags: ["시장동향", "SOC", "노후인프라", "정부정책"],
      content: `# 국내 보수보강 시장 동향

## 인프라 노후화 현황

### 도로 교량
- 전체 교량 수: 약 36,000개소
- 평균 사용연수: 20.4년
- 30년 이상 노후 교량: 17.7% (2022년) → **51.3% (2030년 전망)**
- D등급 시설물 중 76.0%가 30년 이상

### 철도 시설물
- 30년 이상 노후 철도시설물: 전체의 약 32% (1,407개소)
- 노후 철도교량: 1,159개소
- 노후 철도터널: 248개소

## 정부 SOC 예산 (2026년)
- **총 SOC 예산: 27.7조 원** (4년래 최대)
- 국토교통부 예산: 62.8조 원 (역대 최대)
- 철도 55개 사업: 4.6조 원
- 도로 201개 사업: 3.5조 원

## 시장 전망
- 신규 건설 → **유지보수 중심 패러다임 전환** 가속화
- 2030년까지 교량 절반 이상 노후화 → 보수보강 수요 급증
- 정부 노후 인프라 전면 재정비 정책 추진
- 2026년 건설수주 231.2조 원 전망 (전년 대비 4.0% 증가)

## 핵심 성장 영역
- 교량 보수보강
- 터널 보수
- 건축물 내진보강
- 상하수도 인프라 개선`,
    },
    {
      title: "글로벌 특수몰탈 시장 동향", slug: "global-market-trend", catSlug: null,
      tags: ["글로벌", "시장동향", "M&A", "Sika", "BASF"],
      content: `# 글로벌 특수몰탈 시장 동향

## 시장 규모
- 특수몰탈 전체: 2024년 USD 52억 → 2033년 USD 89억 (CAGR 6.1%)
- 콘크리트 보수몰탈: 2025년 USD 25.2억 → 2031년 USD 35억 (CAGR 5.66%)
- 건식혼합 몰탈: 2025년 USD 402억 → 2030년 USD 543억 (CAGR 6.1~6.4%)
- 아시아-태평양 지역이 최대 시장

## 주요 글로벌 플레이어
- **Sika AG** (스위스): 2023년 MBCC Group(구 BASF) 인수. 시장 1위
- **Saint-Gobain** (프랑스): 2024년 Fosroc 지분 60% 인수
- **Mapei** (이탈리아): 폴리머 개질 몰탈 강점
- **ARDEX** (독일): 바닥재/타일 접착제 전문
- **RPM International** (미국): Tremco, Flowcrete 브랜드

상위 10개 기업이 전체 시장의 약 70% 점유.

## 기술 트렌드
### 건식혼합 몰탈 (Dry Mix)
공장 생산으로 균일한 품질 확보. 셀프 레벨링, 폴리머 개질 제품 수요 증가.

### 탄소저감
- 바이오차: 1kg당 CO2 최대 3kg 저감
- 보조 시멘트질 재료(SCMs): 30~50% 탄소 저감
- EPD 인증 필수화 추세

### 폴리머 개질
재분산형 폴리머 분말(RDP) 적용 확대. 내후성, 내마모성 향상.`,
    },
    {
      title: "KS F 4042 규격 해설", slug: "ks-f-4042-guide", catSlug: "repair-mortar",
      tags: ["KS규격", "KSF4042", "폴리머시멘트모르타르", "품질기준"],
      content: `# KS F 4042 규격 해설

## 규격 개요
**KS F 4042 - 콘크리트 구조물 보수용 폴리머 시멘트 모르타르**

콘크리트 구조물의 단면 보수에 사용하는 폴리머 시멘트 모르타르의 품질 기준을 규정.

## 품질 기준

### 필수 시험 항목
| 시험항목 | 기준값 | 시험방법 |
|---------|--------|---------|
| 압축강도(28일) | ≥40 MPa | KS F 2476 |
| 휨강도(28일) | ≥7 MPa | KS F 2476 |
| 부착강도 | ≥1.5 MPa | KS F 2476 |
| 길이변화율 | ±0.15% | KS F 2476 |

### 선택 시험 항목
| 시험항목 | 기준값 |
|---------|--------|
| 동결융해 저항성 | 상대동탄성계수 ≥80% |
| 중성화 깊이 | ≤2mm |
| 염소이온 침투 깊이 | ≤10mm |

## 시험 빈도
건설공사 품질시험기준(건설기술 진흥법 시행규칙 별표2)에 따라:
- 매 로트(LOT)마다 품질시험 실시
- 압축강도, 휨강도, 부착강도 필수

## VAP 제품 적합 현황
- **RM-100**: 모든 항목 합격 (압축 52.3, 휨 9.8, 부착 2.1)
- **RM-200**: 모든 항목 합격 (압축 68.5, 휨 12.3, 부착 2.8)
- **RM-300S**: 모든 항목 합격 (압축 55.0, 부착 1.9)`,
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
        title: a.title, slug: a.slug, content: a.content,
        excerpt: a.content.slice(0, 200),
        categoryId: catId, tags: a.tags,
        published: true, author: "시스템",
      },
    });

    // 검색용 청크
    const chunks = a.content.split(/\n(?=##?\s)/).filter(c => c.trim().length > 30);
    for (let i = 0; i < chunks.length; i++) {
      await prisma.embedding.upsert({
        where: { id: `emb-article-${article.id}-${i}` },
        update: { content: chunks[i] },
        create: {
          id: `emb-article-${article.id}-${i}`,
          content: chunks[i],
          metadata: JSON.stringify({ sourceType: "article", title: a.title }),
          articleId: article.id,
        },
      });
    }
  }
  console.log(`  위키 문서 ${articles.length}개 생성 (검색 청크 포함)`);

  console.log("\nSeed 완료!");
  console.log(`  카테고리: 5개`);
  console.log(`  KS 규격: 7개`);
  console.log(`  제품: ${products.length}개 (물성 데이터 포함)`);
  console.log(`  위키 문서: ${articles.length}개`);
  console.log(`  검색 청크: 자동 생성됨`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

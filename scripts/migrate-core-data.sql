-- ============================================
-- VAP Mortar Wiki: Core Data Migration
-- Supabase → Local PostgreSQL
-- ============================================

BEGIN;

-- ─── 1. Categories (8건) ───
INSERT INTO categories (id, name, slug, "parentId", "order", "createdAt", "updatedAt") VALUES
('cmnbbtw4m0000kem0mvtn3z14', '보수몰탈', 'repair-mortar', NULL, 1, '2026-03-29T05:36:42.215', '2026-03-29T05:36:42.215'),
('cmnbbtw6q0001kem01xlsc0sx', '방수몰탈', 'waterproof-mortar', NULL, 2, '2026-03-29T05:36:42.29', '2026-03-29T05:36:42.29'),
('cmnbbtw8p0002kem0qk0i29yj', '바닥몰탈', 'floor-mortar', NULL, 3, '2026-03-29T05:36:42.361', '2026-03-29T05:36:42.361'),
('cmnbbtwcl0004kem0naiisrue', '그라우트', 'grout', NULL, 5, '2026-03-29T05:36:42.501', '2026-03-29T05:36:42.501'),
('cmnbbtwcl0004kem0naiisrue_inj', '주입재', 'injection', NULL, 4, '2026-03-29T05:36:42.431', '2026-03-29T05:36:42.431'),
('cat-market', '시장/경쟁사', 'market-analysis', NULL, 6, '2026-03-29T07:22:33.734', '2026-03-29T07:22:33.734'),
('cat-tile', '타일용', 'tile', NULL, 6, '2026-03-29T10:32:50.445', '2026-03-29T10:32:50.445'),
('cat-intl-std', '국제규격', 'international-standards', NULL, 7, '2026-03-29T07:22:33.734', '2026-03-29T07:22:33.734')
ON CONFLICT (id) DO NOTHING;

-- fix: 주입재 ID가 원본과 다르므로 수정
UPDATE categories SET id = 'cmnbbtwcl0004kem0naiisrue_inj' WHERE slug = 'injection';
DELETE FROM categories WHERE id = 'cmnbbtwcl0004kem0naiisrue_inj';
INSERT INTO categories (id, name, slug, "parentId", "order", "createdAt", "updatedAt") VALUES
('cmnbbtwan0003kem02wxxwy1i', '주입재', 'injection', NULL, 4, '2026-03-29T05:36:42.431', '2026-03-29T05:36:42.431')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Standards (13건) ───
INSERT INTO standards (id, code, name, description, category, "createdAt", "updatedAt") VALUES
('cmnbbtwej0005kem0dyc0n6tf', 'KS F 4042', '콘크리트 구조물 보수용 폴리머 시멘트 모르타르', '## 적용 범위
콘크리트 구조물의 단면 보수에 사용하는 폴리머 시멘트 모르타르의 품질 기준을 규정한다.

## 주요 시험항목 및 기준값

| 시험항목 | 기준값 | 시험방법 |
|---------|--------|---------|
| 압축강도(28일) | ≥40 MPa | KS F 2476 |
| 휨강도(28일) | ≥7 MPa | KS F 2476 |
| 부착강도 | ≥1.5 MPa | KS F 2476 |
| 길이변화율 | ±0.15% | KS F 2476 |', 'KS', '2026-03-29T05:36:42.572', '2026-03-29T05:36:42.572'),
('cmnbbtwgi0006kem07o69f44q', 'KS F 4044', '수경성 시멘트 무수축 그라우트', '## 적용 범위
수경성 시멘트를 결합재로 하는 무수축 그라우트재의 품질 및 시험 방법을 규정한다.

## 주요 시험항목 및 기준값

| 시험항목 | 기준값 | 비고 |
|---------|--------|------|
| 압축강도(1일) | ≥20 MPa | 조기 강도 |
| 압축강도(28일) | ≥45 MPa | 장기 강도 |
| 팽창률 | 0~0.3% | 무수축 보장 |
| 유동성(J 깔때기) | 4~12초 | 유동형 |
| 블리딩률 | 0% | 재료분리 방지 |', 'KS', '2026-03-29T05:36:42.642', '2026-03-29T05:36:42.642'),
('cmnbbtwih0007kem0vgwri7t5', 'KS F 2476', '폴리머 시멘트 모르타르의 시험방법', '## 적용 범위
폴리머 시멘트 모르타르의 각종 물성 시험 방법을 규정한다.', 'KS', '2026-03-29T05:36:42.713', '2026-03-29T05:36:42.713'),
('cmnbbtwkf0008kem0cg0i9qdp', 'KS F 4716', '시멘트계 바탕 바름재', '## 적용 범위
시멘트계 바탕 바름재의 품질 기준을 규정한다.', 'KS', '2026-03-29T05:36:42.783', '2026-03-29T05:36:42.783'),
('cmnbbtwme0009kem0dekg6odg', 'KDS 14 31 05', '콘크리트 구조물 보수보강 설계기준', '## 적용 범위
콘크리트 구조물의 보수보강 설계에 관한 기술기준 (2024년 개정)', 'KDS', '2026-03-29T05:36:42.854', '2026-03-29T05:36:42.854'),
('cmnbbtwoa000akem0v7gpfo73', 'KS F 4916', '시멘트 혼화용 폴리머', '## 적용 범위
시멘트 모르타르에 혼화하는 폴리머의 품질 기준을 규정한다.', 'KS', '2026-03-29T05:36:42.922', '2026-03-29T05:36:42.922'),
('cmnbbtwq7000bkem0fvzafx1g', 'KS F 2624', '균열 보수용 직접 주입재의 내피로 성능 시험방법', '## 적용 범위
균열 보수용 직접 주입재의 내피로 성능 시험 방법을 규정한다.', 'KS', '2026-03-29T05:36:42.991', '2026-03-29T05:36:42.991'),
('std-en1504', 'EN 1504', '유럽 콘크리트 보수 표준 (전 10부)', '## 적용 범위
콘크리트 구조물의 보호 및 보수를 위한 유럽 표준. 전 10부 구성.', 'EN', '2026-03-29T06:27:34.179', '2026-03-29T06:27:34.179'),
('std-en1504-3', 'EN 1504-3', '콘크리트 구조/비구조 ��수 등급 (R1~R4)', '## 보수재 등급 (R1~R4)

| 등급 | 용도 | 최소 압축강도 |
|------|------|------------|
| R1 | 비구조 보수 | ≥10 MPa |
| R2 | 비구조 보수 | ≥15 MPa |
| R3 | 구조 보수 | ≥25 MPa |
| R4 | 고강도 구조 보수 | ≥45 MPa |', 'EN', '2026-03-29T06:27:34.179', '2026-03-29T06:27:34.179'),
('std-astmc928', 'ASTM C928', '급속경화 시멘트계 보수재', '## 적용 범위
급속 경화 시멘트계 보수재의 품질 기준.', 'ASTM', '2026-03-29T06:27:34.179', '2026-03-29T06:27:34.179'),
('std-astmc1107', 'ASTM C1107', '무수축 시멘트계 그라우트', '## 적용 범위
프리패키지 무수축 시멘트 그라우트의 품질 기준.', 'ASTM', '2026-03-29T06:27:34.179', '2026-03-29T06:27:34.179'),
('std-aci546', 'ACI 546', '콘크리트 보수 가이드 (2023)', '## 적용 범위
콘크리트 보수에 대한 종합 가이드.', 'ACI', '2026-03-29T06:27:34.179', '2026-03-29T06:27:34.179'),
('std-bs6319', 'BS 6319', '수지/폴리머 조성물 시험방법', '## 적용 범위
수지 및 폴리머 조성물의 기계적 성능 시험 방법. 전 7부 구성.', 'BS', '2026-03-29T06:27:34.179', '2026-03-29T06:27:34.179')
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Products (23건) ───
-- 삼표 그라우트 (6종)
INSERT INTO products (id, code, name, "categoryId", description, usage, scope, "mixRatio", method, curing, packaging, "createdAt", "updatedAt") VALUES
('sp-sg45n', 'SG 45N', '범용 무수축 그라우트', 'cmnbbtwcl0004kem0naiisrue', '고강도가 요구되지 않는 구조물에 범용으로 사용 가능한 무수축 그라우트 몰탈.', '일반 기계기초 / 그라우팅', '일반 기계 기초 및 그라우팅 공사, PC부재 조인트 충전, 앙카볼트 고정', '분체 25kg : 물 3.25~3.75L', '거푸집 설치 → 배합(3분 이상) → 연속 타설 → 양생', '기온 5°C 이상, 타설 후 습윤양생', '25kg/포', '2026-03-29T10:33:21.35', '2026-03-29T10:33:21.35'),
('sp-sg60p', 'SG 60P', '패드형 무수축 그라우트', 'cmnbbtwcl0004kem0naiisrue', '유동성과 강도 발현 특성이 우수한 패드형 무수축 그라우트.', '대형 기계기초 / 패드 그라우트', '대형 기계류의 기초 및 패드 그라우트, 각종 레일 고정 부위', '분체 25kg : 물 3.0~3.5L', '거푸집 설치 → 배합 → 연속 타설(중단 금지) → 양생', '습윤양생 3일 이상', '25kg/포', '2026-03-29T10:33:21.35', '2026-03-29T10:33:21.35'),
('sp-sg70s', 'SG 70S', 'PC슬리브용 무수축 그라우트', 'cmnbbtwcl0004kem0naiisrue', '우수한 유동성과 고강도 특성, 충진성을 갖춘 PC슬리브 전용 무수축 그라우트.', 'PC슬리브 충진 / PC접합', 'PC슬리브 충진, PC부재 접합부, 고강도 요구 기계기초', '분체 25kg : 물 2.75~3.25L', 'PC슬리브 세척 → 배합 → 주입(펌프 또는 자중) → 양생', '습윤양생 3일 이상', '25kg/포', '2026-03-29T10:33:21.35', '2026-03-29T10:33:21.35'),
('sp-sg70sp', 'SG 70S+', 'PC슬리브용 무수축 그라우트 (개선형)', 'cmnbbtwcl0004kem0naiisrue', 'SG 70S의 개선형으로 유동성과 충진성이 더욱 향상된 PC슬리브 전용 그라우트.', 'PC슬리브 충진 / PC접합', 'PC슬리브 충진, PC부재 접합부, 협소 공간 충진', '분체 25kg : 물 2.75~3.25L', 'PC슬리브 세척 → 배합 → 주입 → 양생', '습윤양생 3일 이상', '25kg/포', '2026-03-29T10:33:21.35', '2026-03-29T10:33:21.35'),
('sp-sg80es', 'SG 80ES', '초속경 무수축 그라우트', 'cmnbbtwcl0004kem0naiisrue', '3시간 내 실용강도 발현이 가능한 초속경 무수축 그라우트.', '긴급 보수 / 초속경 충전', '콘크리트 표면·바닥·벽 긴급 보수, 교량 신축이음장치 보수', '분체 25kg : 물 2.75~3.0L', '열화부 제거 → 배합(2분 이내) → 신속 타설 → 양생', '2시간 후 교통 개방 가능', '25kg/포', '2026-03-29T10:33:21.35', '2026-03-29T10:33:21.35'),
('sp-rail', 'SP-RAIL', '철도용 무수축 몰탈', 'cmnbbtwcl0004kem0naiisrue', '철도 궤도 시공 전용 무수축 몰탈.', '철도 궤도 시공', '철도 레일 고정, 궤도 기초 충전', '분체 25kg : 물 적정량', '궤도 기초 정리 → 배합 → 타설 → 양생', '습윤양생', '25kg/포', '2026-03-29T10:34:15.18', '2026-03-29T10:34:15.18'),
-- 삼표 보수 (1종)
('sp-sppm400', 'SPPM 400', '폴리머시멘트 보수몰탈', 'cmnbbtw4m0000kem0mvtn3z14', '하나의 제품으로 미장·뿜칠 등 다양한 시공이 가능한 폴리머시멘트 보수몰탈.', '콘크리트 단면보수 / 미장·뿜칠', '열화·부식·백화로 파손된 콘크리트 건물 단면보수', '분체 25kg : ��� 4~5L', '하지처리 → 프라이머 → 충전/미장 또는 뿜칠(1회 최대 30mm) → 양생', '습윤양생 3일 이상, 기온 5°C 이상', '25kg/포', '2026-03-29T10:33:50.513', '2026-03-29T10:33:50.513'),
-- 삼표 바닥 (4종)
('sp-spsl1040', 'SPSL 1040', '자기수평 몰탈', 'cmnbbtw8p0002kem0qk0i29yj', '평활도가 우수하여 자기수평에 의한 마감이 가능한 셀프레벨링 몰탈.', '바닥 레벨링 / 평활 마감', '신축·복구 공사 바닥 평활 마감', '분체 25kg : 물 5.5~6.0L', '바닥면 청소 → 프라이머 → 배합 → 자기수평 타설(3~50mm) → 양생', '자연양생 24시간, 보행 가능 4~6시간', '25kg/포', '2026-03-29T10:33:50.513', '2026-03-29T10:33:50.513'),
('sp-sfm1000', 'SFM-1000', '일반바닥용 몰탈', 'cmnbbtw8p0002kem0qk0i29yj', '일반 건축물 바닥 시공에 적합한 범용 바닥몰탈.', '일반 바닥 시공', '공동주택, 상업시설, 사무실 등 일반 건축물 바닥', '분체 40kg : 물 적정량', '바닥면 청소 → 배합 → 타설 → 평탄작업 → 양생', '자연양생', '40kg/포', '2026-03-29T10:33:50.513', '2026-03-29T10:33:50.513'),
('sp-sfm2000', 'SFM-2000', '고급바닥용 몰탈', 'cmnbbtw8p0002kem0qk0i29yj', '고급 바닥 마감이 요구되는 현장에 적합한 바닥몰탈.', '고급 바닥 시공', '고급 상업시설, 전시장, 호텔 등', '분체 40kg : 물 적정량', '바닥면 청소 → 프라이머 → 배합 → 타설 → 평탄작업 → 양생', '자연양생', '40kg/포', '2026-03-29T10:33:50.513', '2026-03-29T10:33:50.513'),
('sp-sfm2000h', 'SFM-2000H', '고강도바닥용 몰탈', 'cmnbbtw8p0002kem0qk0i29yj', '고강도가 요구되는 산업시설 바닥에 적합한 고강도 바닥몰탈.', '고강도 바닥 시공', '공장, 물류센터, 주차장 등 고하중·고내마모 바닥', '분체 40kg : 물 적정량', '바닥면 청소 → 프라이머 → 배합 → 타설 → 평탄작업 → 양생', '자연양생', '40kg/포', '2026-03-29T10:34:15.18', '2026-03-29T10:34:15.18'),
-- 삼표 타일 (4종)
('sp-st100', 'ST-100', '타일압착용 몰탈 (백색)', 'cat-tile', '백색 시멘트 기반 타일 압착용 프리믹스 몰탈.', '타일 압착 시공', '벽면·바닥 타일 압착 시공', '분체 : 물 = 적정 배합비', '타일 뒷면 배합물 도포 → 압착 → 양생', '자연양생 24시간', '20kg/포', '2026-03-29T10:34:15.18', '2026-03-29T10:34:15.18'),
('sp-st101', 'ST-101', '타일압착용 몰탈 (회색)', 'cat-tile', '회색 시멘트 기반 타일 압착용 프리믹스 몰탈.', '타일 압착 시공', '벽면·바닥 타일 압착 시공', '분체 : 물 = 적정 배합비', '타일 뒷면 배합물 도포 → 압착 → 양생', '자연양생 24시간', '20kg/포', '2026-03-29T10:34:15.18', '2026-03-29T10:34:15.18'),
('sp-st2000', 'ST-2000', '타일줄눈용 몰탈 (백색)', 'cat-tile', '백색 시멘트 기반 타일 줄눈 충전용 몰탈.', '타일 줄��� 충전', '백색 줄눈 마감이 필요한 타일 공사', '분체 : 물 = 적정 배합비', '타일 시공 완료 후 → 줄눈 배합물 충전 → 표면 정리 → 양생', '자연양생', '20kg/포', '2026-03-29T10:34:15.18', '2026-03-29T10:34:15.18'),
('sp-st2001', 'ST-2001', '타일줄눈용 몰탈 (회색)', 'cat-tile', '회색 시멘트 기반 타일 줄눈 충전용 몰탈.', '타일 줄눈 충전', '일반 줄눈 마감 타일 공사', '분체 : 물 = 적정 배합비', '타일 시공 완료 후 → 줄눈 배합물 충전 → 표면 정리 → 양생', '자연양생', '20kg/포', '2026-03-29T10:34:15.18', '2026-03-29T10:34:15.18'),
-- 경쟁사 Saint-Gobain Weber (8종)
('cmndmxrd30002ketgrx91tx3h', 'SG-HB40', 'webercem HB40 (Saint-Gobain)', 'cmnbbtw4m0000kem0mvtn3z14', 'Saint-Gobain Weber의 1액형 폴리머 개질 고부착 시멘트계 보수 모르타르. BS EN 1504-3 R3 등급.', '구조 콘크리트 단면보수', '주차장 상부슬래브, 교량 구조물, 기둥, 보 등', '분체 : 물 = 20kg : 약 3.6L', '열화부 제거 → 프라이머 → 배합 후 충전 → 습윤양생', '습윤양생 권장', '20kg/포', '2026-03-30T20:23:10.791', '2026-03-30T20:23:10.791'),
('cmndmxrkm0004ketgkk9lcd79', 'SG-PYRATOP', 'webercem Pyratop (Saint-Gobain)', 'cmnbbtw4m0000kem0mvtn3z14', 'Saint-Gobain Weber의 2액형 급결 보수 콘크리트.', '급속 경화 콘크리트 보수', '도로 포장 보수, 교통 개방 필요 현장', '분체 + 특수골재 + 물 (2파트)', '열화부 제거 → 혼합 → 25~30분 내 시공 → 경화', '6시간 후 교통 개방 (20°C)', '키트 단위', '2026-03-30T20:23:11.063', '2026-03-30T20:23:11.063'),
('cmndmxrsc0006ketgm0lj3qje', 'SG-ARC', 'webercem Advanced Repair Concrete (Saint-Gobain)', 'cmnbbtw4m0000kem0mvtn3z14', 'Saint-Gobain Weber의 유동성 재타설 보수 콘크리트. BS EN 1504-3 R4 등급.', '유동성 구조 보수', '철근 조밀 구간, 기둥 재킷팅', '유동성 타입 (물 첨가)', '거푸집 설치 → 배합 → 연속 타설 → 양생', '습윤양생', '25kg/포', '2026-03-30T20:23:11.34', '2026-03-30T20:23:11.34'),
('cmndmxrwt0008ketgimewgt33', 'SG-NSG', 'webertec Non-Shrink Grout+ (Saint-Gobain)', 'cmnbbtwcl0004kem0naiisrue', 'Saint-Gobain Weber의 프리믹스 시멘트계 무수축 그라우트. 압축강도 70MPa 이상.', '무수축 충전 / 기계기초', '기둥·보·프리캐스트 접합부 충전, 기계기초', '유동: 물 약 13~15% / 경화: 물 약 10~12%', '거푸집 설치 → 배합 → 연속 타설 → 양생', '습윤양생 3일 이상', '25kg/포', '2026-03-30T20:23:11.501', '2026-03-30T20:23:11.501'),
('cmndmxs3p000aketgd5on7h5b', 'SG-301HCS', 'webertec 301 HCS (Saint-Gobain)', 'cmnbbtwcl0004kem0naiisrue', 'Saint-Gobain Weber의 고강도 무수축 그라우트. 28일 압축강도 72MPa 이상.', '고강도 무수축 충전', '고강도 콘크리트 보수, 교량 받침, 앵커 정착', '유동/소성 타입 선택', '거푸집 설치 → 배합 → 연속 타설 → 양생', '습윤양생', '25kg/포', '2026-03-30T20:23:11.749', '2026-03-30T20:23:11.749'),
('cmndmxs72000cketgp38un54p', 'SG-MOISTSEAL', 'weberdry Moistseal (Saint-Gobain)', 'cmnbbtw6q0001kem01xlsc0sx', 'Saint-Gobain Weber의 1액형 시멘트계 방수 모르타르.', '시멘트계 침투방수', '욕실·화장실 외벽, 콘크리트 벽체, 지하실', '분체 : 물 = 100 : 50~60', '표면 청소 → 물 적심 → 1차 도포 → 2차 도포', '자연양생', '20kg/포', '2026-03-30T20:23:11.87', '2026-03-30T20:23:11.87'),
('cmndmxsbf000eketg5pg4cnlz', 'SG-ES119', 'weberdry ES 119 (Saint-Gobain)', 'cmnbbtw6q0001kem01xlsc0sx', 'Saint-Gobain Weber의 수성 비투멘 방수막.', '비투멘계 도막방수', '기초, 지하구조물, 옥상', '원액 사용', '표면 청소 → 프라이머 → 2회 도포 → 건조', '자연건조', '통 단위', '2026-03-30T20:23:12.027', '2026-03-30T20:23:12.027'),
('cmndmxsfx000gketgbryqjheq', 'SG-FL1145', 'weberfloor 1145 (Saint-Gobain)', 'cmnbbtw8p0002kem0qk0i29yj', 'Saint-Gobain Weber의 셀프 레벨링 바닥 몰탈. 4~10mm 두께.', '바닥 레벨링', '주거, 병원, 상업시설 바닥 평활화', '분체 : 물 = 25kg : 약 6L', '바닥면 청소 → 프라이머 → 배합 → 타설 → 자기수평', '보행 가능: 약 4시간, 마감재 시공: 24시간 후', '25kg/포 (Grey)', '2026-03-30T20:23:12.189', '2026-03-30T20:23:12.189')
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Product Standards (13건) ───
INSERT INTO product_standards ("productId", "standardId") VALUES
('sp-sg45n', 'cmnbbtwgi0006kem07o69f44q'),
('sp-sg60p', 'cmnbbtwgi0006kem07o69f44q'),
('sp-sg70s', 'cmnbbtwgi0006kem07o69f44q'),
('sp-sg70sp', 'cmnbbtwgi0006kem07o69f44q'),
('sp-sg80es', 'cmnbbtwgi0006kem07o69f44q'),
('sp-sg45n', 'std-astmc1107'),
('sp-sg60p', 'std-astmc1107'),
('sp-sg70s', 'std-astmc1107'),
('sp-sg80es', 'std-astmc1107'),
('sp-sppm400', 'cmnbbtwej0005kem0dyc0n6tf'),
('sp-sppm400', 'cmnbbtwih0007kem0vgwri7t5'),
('sp-spsl1040', 'cmnbbtwkf0008kem0cg0i9qdp'),
('sp-rail', 'cmnbbtwgi0006kem07o69f44q')
ON CONFLICT DO NOTHING;

-- ─── 5. Product Properties (53건) ───
-- 삼표 그라우트 물성
INSERT INTO product_properties (id, "productId", name, unit, standard, value, "testMethod", "testDate", passed) VALUES
('pp-sg45n-1', 'sp-sg45n', '압축강도(1일)', 'MPa', '≥10', '15', 'KS F 4044', NULL, true),
('pp-sg45n-2', 'sp-sg45n', '압축강도(28일)', 'MPa', '≥45', '48', 'KS F 4044', NULL, true),
('pp-sg45n-3', 'sp-sg45n', '팽창률', '%', '0~0.3', '0.05', 'KS F 4044', NULL, true),
('pp-sg45n-4', 'sp-sg45n', '유동성(J깔때기)', '초', '4~12', '8', 'KS F 4044', NULL, true),
('pp-sg60p-1', 'sp-sg60p', '압축강도(1일)', 'MPa', '≥15', '25', 'KS F 4044', NULL, true),
('pp-sg60p-2', 'sp-sg60p', '압축강도(28일)', 'MPa', '≥60', '63', 'KS F 4044', NULL, true),
('pp-sg60p-3', 'sp-sg60p', '팽창률', '%', '0~0.3', '0.05', 'KS F 4044', NULL, true),
('pp-sg60p-4', 'sp-sg60p', '유동성(J깔때기)', '초', '4~12', '7', 'KS F 4044', NULL, true),
('pp-sg70s-1', 'sp-sg70s', '압축강도(1일)', 'MPa', '≥20', '30', 'KS F 4044', NULL, true),
('pp-sg70s-2', 'sp-sg70s', '압축강도(28일)', 'MPa', '≥70', '73', 'KS F 4044', NULL, true),
('pp-sg70s-3', 'sp-sg70s', '팽창률', '%', '0~0.3', '0.04', 'KS F 4044', NULL, true),
('pp-sg70s-4', 'sp-sg70s', '유동성(J깔때기)', '초', '4~12', '6', 'KS F 4044', NULL, true),
('pp-sg70sp-1', 'sp-sg70sp', '압축강도(1일)', 'MPa', '≥20', '32', 'KS F 4044', NULL, true),
('pp-sg70sp-2', 'sp-sg70sp', '압축강도(28일)', 'MPa', '≥70', '75', 'KS F 4044', NULL, true),
('pp-sg70sp-3', 'sp-sg70sp', '팽창률', '%', '0~0.3', '0.04', 'KS F 4044', NULL, true),
('pp-sg70sp-4', 'sp-sg70sp', '유동성(J깔때기)', '초', '4~12', '5', 'KS F 4044', NULL, true),
('pp-sg80es-1', 'sp-sg80es', '압축강도(3시간)', 'MPa', '≥21', '22', 'KS F 4044', NULL, true),
('pp-sg80es-2', 'sp-sg80es', '압축강도(1일)', 'MPa', '≥30', '45', 'KS F 4044', NULL, true),
('pp-sg80es-3', 'sp-sg80es', '압축강도(28일)', 'MPa', '≥80', '83', 'KS F 4044', NULL, true),
('pp-sg80es-4', 'sp-sg80es', '팽창률', '%', '0~0.3', '0.03', 'KS F 4044', NULL, true),
-- 삼표 보수/바닥 물성
('pp-sppm-1', 'sp-sppm400', '압축강도(28일)', 'MPa', '≥40', '42', 'KS F 4042', NULL, true),
('pp-sppm-2', 'sp-sppm400', '휨강도(28일)', 'MPa', '≥7', '8.5', 'KS F 4042', NULL, true),
('pp-sppm-3', 'sp-sppm400', '부착강도', 'MPa', '≥1.5', '1.8', 'KS F 4042', NULL, true),
('pp-sppm-4', 'sp-sppm400', '길이변화율', '%', '±0.15', '0.05', 'KS F 4042', NULL, true),
('pp-spsl-1', 'sp-spsl1040', '압축강도(28일)', 'MPa', '≥25', '30', 'KS F 4716', NULL, true),
('pp-spsl-2', 'sp-spsl1040', '유동성', 'mm', '≥200', '240', 'KS F 4716', NULL, true),
('pp-spsl-3', 'sp-spsl1040', '부착강도', 'MPa', '≥0.5', '1.0', 'KS F 4716', NULL, true),
-- 경쟁사 Saint-Gobain Weber 물성
('cmndmxrd30002ketgrx91tx3h-압축강도(28일)', 'cmndmxrd30002ketgrx91tx3h', '압축강도(28일)', 'MPa', '≥25 (R3)', '약 40~45', 'BS EN 12190', NULL, true),
('cmndmxrd30002ketgrx91tx3h-부착강도', 'cmndmxrd30002ketgrx91tx3h', '부착강도', 'MPa', '≥1.5', '≥1.5', 'BS EN 1542', NULL, true),
('cmndmxrd30002ketgrx91tx3h-최대 시공두께(수직)', 'cmndmxrd30002ketgrx91tx3h', '최대 시공두께(수직)', 'mm', '-', '75', '-', NULL, true),
('cmndmxrd30002ketgrx91tx3h-최대 시공두께(상향)', 'cmndmxrd30002ketgrx91tx3h', '최대 시공두께(상향)', 'mm', '-', '50', '-', NULL, true),
('cmndmxrkm0004ketgkk9lcd79-작업시간(20°C)', 'cmndmxrkm0004ketgkk9lcd79', '작업시간(20°C)', '분', '-', '25~30', '-', NULL, true),
('cmndmxrkm0004ketgkk9lcd79-경화시간(20°C)', 'cmndmxrkm0004ketgkk9lcd79', '경화시간(20°C)', '분', '-', '45', '-', NULL, true),
('cmndmxrkm0004ketgkk9lcd79-교통개방(20°C)', 'cmndmxrkm0004ketgkk9lcd79', '교통개방(20°C)', '시간', '-', '6', '-', NULL, true),
('cmndmxrkm0004ketgkk9lcd79-교통개방(10°C)', 'cmndmxrkm0004ketgkk9lcd79', '교통개방(10°C)', '시간', '-', '18', '-', NULL, true),
('cmndmxrkm0004ketgkk9lcd79-동결융해 저항성', 'cmndmxrkm0004ketgkk9lcd79', '동결융해 저항성', '-', '적합', '적합', 'BS EN', NULL, true),
('cmndmxrsc0006ketgm0lj3qje-압축강도(28일)', 'cmndmxrsc0006ketgm0lj3qje', '압축강도(28일)', 'MPa', '≥45 (R4)', '≥45', 'BS EN 12190', NULL, true),
('cmndmxrsc0006ketgm0lj3qje-분류', 'cmndmxrsc0006ketgm0lj3qje', '분류', '-', 'R4', 'R4', 'BS EN 1504-3', NULL, true),
('cmndmxrwt0008ketgimewgt33-압축강도(28일)', 'cmndmxrwt0008ketgimewgt33', '압축강도(28일)', 'MPa', '≥60', '≥70', 'BS EN 12390', NULL, true),
('cmndmxrwt0008ketgimewgt33-밀도', 'cmndmxrwt0008ketgimewgt33', '밀도', 'g/cm³', '-', '1.40', '-', NULL, true),
('cmndmxrwt0008ketgimewgt33-가사시간', 'cmndmxrwt0008ketgimewgt33', '가사시간', '분', '-', '120', '-', NULL, true),
('cmndmxrwt0008ketgimewgt33-적용온도', 'cmndmxrwt0008ketgimewgt33', '적용온도', '°C', '-', '+5 ~ +40', '-', NULL, true),
('cmndmxs3p000aketgd5on7h5b-��축강도(28일)', 'cmndmxs3p000aketgd5on7h5b', '압축강도(28일)', 'MPa', '≥60', '≥72', 'BS EN 12390', NULL, true),
('cmndmxs72000cketgp38un54p-소요량', 'cmndmxs72000cketgp38un54p', '소요량', 'kg/m²', '-', '2.0 (2회)', '-', NULL, true),
('cmndmxs72000cketgp38un54p-차수 방향', 'cmndmxs72000cketgp38un54p', '차수 방향', '-', '-', '양방향', '-', NULL, true),
('cmndmxsbf000eketg5pg4cnlz-제형', 'cmndmxsbf000eketg5pg4cnlz', '제형', '-', '-', '수성 비투멘', '-', NULL, true),
('cmndmxsbf000eketg5pg4cnlz-근부 저항성', 'cmndmxsbf000eketg5pg4cnlz', '근부 저항성', '-', '적합', '적합', '-', NULL, true),
('cmndmxsfx000gketgbryqjheq-압축강도(28일)', 'cmndmxsfx000gketgbryqjheq', '압축강도(28일)', 'MPa', '≥20', '23.5', 'EN 13892', NULL, true),
('cmndmxsfx000gketgbryqjheq-휨강도(28일)', 'cmndmxsfx000gketgbryqjheq', '휨강도(28일)', 'MPa', '≥4', '7.0', 'EN 13892', NULL, true),
('cmndmxsfx000gketgbryqjheq-부착강도', 'cmndmxsfx000gketgbryqjheq', '부착강도', 'MPa', '≥0.5', '0.58', 'EN 13892', NULL, true),
('cmndmxsfx000gketgbryqjheq-적용두께', 'cmndmxsfx000gketgbryqjheq', '적용두께', 'mm', '-', '4~10', '-', NULL, true),
('cmndmxsfx000gketgbryqjheq-소요량', 'cmndmxsfx000gketgbryqjheq', '소요량', 'kg/m²/mm', '-', '1.7', '-', NULL, true),
('cmndmxsfx000gketgbryqjheq-시공온도', 'cmndmxsfx000gketgbryqjheq', '시공온도', '°C', '-', '15~40', '-', NULL, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;

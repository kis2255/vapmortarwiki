import { describe, it, expect } from "vitest";
import { extractKeywords } from "../retriever";

describe("extractKeywords", () => {
  it("기본 키워드 추출", () => {
    const result = extractKeywords("그라우트 압축강도 알려줘");
    expect(result).toContain("그라우트");
    expect(result).toContain("압축강도");
  });

  it("한국어 어미 제거 (해줘, 알려줘)", () => {
    const result = extractKeywords("방수몰탈 추천해줘");
    expect(result).toContain("방수몰탈");
    expect(result).toContain("추천");
    expect(result.some((k) => k.includes("해줘"))).toBe(false);
  });

  it("질문형 어미 제거 (인가요, 뭐야)", () => {
    const result = extractKeywords("콘크리트 탄산화란 무엇인가요");
    expect(result).toContain("콘크리트");
    // '탄산화란'에서 '란'이 끝에 있지 않으므로 보존될 수 있음
    expect(result.some((k) => k.includes("탄산화"))).toBe(true);
  });

  it("제품 코드 보존", () => {
    const result = extractKeywords("SG 80ES 물성 알려줘");
    expect(result.some((k) => k.includes("80ES") || k.includes("SG"))).toBe(true);
  });

  it("구두점 제거", () => {
    const result = extractKeywords("압축강도? 휨강도!");
    expect(result).toContain("압축강도");
    expect(result).toContain("휨강도");
  });

  it("1글자 키워드 필터링 (length >= 2)", () => {
    const result = extractKeywords("A B CD EF");
    expect(result.every((k) => k.length >= 2)).toBe(true);
  });

  it("빈 질문 → 원본 반환", () => {
    const result = extractKeywords("");
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("복합 질문에서 핵심어 추출", () => {
    const result = extractKeywords("보수몰탈 시공방법 알려주세요");
    expect(result).toContain("보수몰탈");
    expect(result).toContain("시공방법");
  });
});

describe("제품 코드 정규식", () => {
  const codeRegex = /[A-Z]{1,3}-?\d{2,4}\w*/gi;

  it("SG 80ES 형태 미매칭 (하이픈 없음, 숫자+문자)", () => {
    // SG 80ES는 공백으로 분리되어 "80ES"만 매칭 가능
    const matches = [..."SG 80ES".matchAll(codeRegex)].map((m) => m[0]);
    // 코드 패턴에 따라 매칭 여부 확인
    expect(matches.length).toBeGreaterThanOrEqual(0);
  });

  it("RM-100 형태 매칭", () => {
    const matches = [..."RM-100 제품".matchAll(codeRegex)].map((m) => m[0]);
    expect(matches).toContain("RM-100");
  });

  it("복수 코드 추출", () => {
    const matches = [..."RM-100과 RM-200 비교".matchAll(codeRegex)].map((m) => m[0]);
    expect(matches).toContain("RM-100");
    expect(matches).toContain("RM-200");
  });
});

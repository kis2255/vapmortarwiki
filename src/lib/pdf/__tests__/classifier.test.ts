import { describe, it, expect } from "vitest";
import { classifyByKeywords, classifyByFilename, classifyDocument } from "../classifier";

describe("classifyByKeywords", () => {
  it("TDS 키워드 매칭 (배합비, 시공방법, 양생)", () => {
    const result = classifyByKeywords("이 제품의 배합비는 1:3이며 시공방법은 미장입니다. 양생 3일.");
    expect(result.type).toBe("TDS");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("MSDS 키워드 매칭 (CAS번호, 안전보건자료)", () => {
    const result = classifyByKeywords("CAS번호: 1234-56-7. 안전보건자료에 따른 유해성 분류.");
    expect(result.type).toBe("MSDS");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("TEST_REPORT 키워드 매칭 (시험결과, 압축강도)", () => {
    const result = classifyByKeywords("시험결과: 압축강도 45MPa. 시험일자 2026-03-29. 시험기관: KCL");
    expect(result.type).toBe("TEST_REPORT");
  });

  it("CERTIFICATE 키워드 매칭 (인증번호)", () => {
    const result = classifyByKeywords("인증번호 KS-2026-001. 유효기간 2027-12-31. 인증기관 KS인증.");
    expect(result.type).toBe("CERTIFICATE");
  });

  it("키워드 없으면 OTHER, confidence 0", () => {
    const result = classifyByKeywords("오늘 날씨가 좋습니다.");
    expect(result.type).toBe("OTHER");
    expect(result.confidence).toBe(0);
  });

  it("confidence가 1.0을 초과하지 않음", () => {
    // 모든 MSDS 키워드를 포함 (weight 1.2 × 1.0 → 1.2 → capped 1.0)
    const allMsds = "CAS번호 CAS No 노출기준 유해성 응급조치 안전보건자료 MSDS SDS 화학물질";
    const result = classifyByKeywords(allMsds);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("대소문자 무시 (msds → MSDS)", () => {
    const result = classifyByKeywords("이 문서는 msds 안전보건자료입니다.");
    expect(result.type).toBe("MSDS");
  });

  it("혼합 키워드 시 가중치 높은 쪽 승리", () => {
    // MSDS(weight 1.2) vs TDS(weight 1.0) 동일 개수 매칭 시
    const result = classifyByKeywords("배합비 시공방법 CAS번호 유해성");
    expect(result.type).toBe("MSDS"); // weight 1.2 > 1.0
  });
});

describe("classifyByFilename", () => {
  it("TDS 파일명", () => {
    expect(classifyByFilename("SG-500_TDS_v2.pdf")).toBe("TDS");
  });

  it("MSDS 파일명", () => {
    expect(classifyByFilename("제품_MSDS.pdf")).toBe("MSDS");
  });

  it("SDS 파일명 → MSDS", () => {
    expect(classifyByFilename("Product_SDS_2026.pdf")).toBe("MSDS");
  });

  it("시험 → TEST_REPORT", () => {
    expect(classifyByFilename("압축강도_시험성적서.pdf")).toBe("TEST_REPORT");
  });

  it("인식 불가 파일명 → null", () => {
    expect(classifyByFilename("document_v3.pdf")).toBeNull();
  });
});

describe("classifyDocument", () => {
  it("파일명 매칭 우선 (confidence 0.8)", () => {
    const result = classifyDocument("SG45N_TDS.pdf", "이 문서는 시험결과입니다.");
    expect(result.type).toBe("TDS");
    expect(result.method).toBe("filename");
    expect(result.confidence).toBe(0.8);
  });

  it("파일명 미매칭 → 키워드 폴백", () => {
    const result = classifyDocument("document.pdf", "배합비 시공방법 양생 적용범위");
    expect(result.type).toBe("TDS");
    expect(result.method).toBe("keyword");
  });

  it("둘 다 미매칭 → unknown", () => {
    const result = classifyDocument("photo.jpg", "사진입니다.");
    expect(result.type).toBe("OTHER");
    expect(result.method).toBe("unknown");
    expect(result.confidence).toBe(0);
  });
});

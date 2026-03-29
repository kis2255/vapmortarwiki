import { describe, it, expect } from "vitest";
import { slugify, formatDate } from "../utils";

describe("slugify", () => {
  it("한국어 텍스트를 하이픈 연결로 변환", () => {
    expect(slugify("에폭시 그라우트 개요")).toBe("에폭시-그라우트-개요");
  });

  it("영문을 소문자로 변환", () => {
    expect(slugify("SG 500 Product")).toBe("sg-500-product");
  });

  it("다중 하이픈 축소", () => {
    expect(slugify("보수 -- 몰탈")).toBe("보수-몰탈");
  });

  it("특수문자 제거, 한국어/영문/숫자 보존", () => {
    expect(slugify("KS F 4042: 규격!")).toBe("ks-f-4042-규격");
  });

  it("빈 문자열 처리", () => {
    expect(slugify("")).toBe("");
  });
});

describe("formatDate", () => {
  it("Date 객체를 한국어 날짜로 포맷", () => {
    const result = formatDate(new Date("2026-03-29"));
    expect(result).toContain("2026");
    expect(result).toContain("03");
    expect(result).toContain("29");
  });

  it("문자열 입력 처리", () => {
    const result = formatDate("2026-01-15");
    expect(result).toContain("2026");
    expect(result).toContain("01");
  });
});

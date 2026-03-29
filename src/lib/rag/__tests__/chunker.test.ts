import { describe, it, expect } from "vitest";
import { chunkText, productToText } from "../chunker";

const baseMeta = { source: "test", sourceId: "test-1", sourceType: "document" as const };

describe("chunkText", () => {
  it("짧은 텍스트 (20자 이상) → 단일 청크", () => {
    const text = "이것은 충분히 긴 텍스트입니다. 최소 20자를 넘어야 합니다.";
    const chunks = chunkText(text, baseMeta);
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe(text);
  });

  it("20자 미만 청크는 제거", () => {
    const chunks = chunkText("짧다", baseMeta);
    expect(chunks.length).toBe(0);
  });

  it("마크다운 헤딩으로 섹션 분할", () => {
    const text = "## 섹션 A\n이것은 섹션 A의 내용입니다. 충분히 긴 텍스트가 필요합니다.\n\n## 섹션 B\n이것은 섹션 B의 내용입니다. 충분히 긴 텍스트가 필요합니다.";
    const chunks = chunkText(text, baseMeta);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.some((c) => c.content.includes("섹션 A"))).toBe(true);
    expect(chunks.some((c) => c.content.includes("섹션 B"))).toBe(true);
  });

  it("테이블을 별도 청크로 분리 (section='table')", () => {
    const text = "본문 텍스트가 있습니다. 이것은 충분히 긴 내용이어야 합니다.\n| 항목 | 값 |\n| --- | --- |\n| 압축강도 | 45 MPa |\n나머지 텍스트 충분히 긴 내용 계속됩니다.";
    const chunks = chunkText(text, baseMeta);
    const tableChunks = chunks.filter((c) => c.metadata.section === "table");
    expect(tableChunks.length).toBe(1);
    expect(tableChunks[0].content).toContain("압축강도");
  });

  it("metadata에 section 정보 포함", () => {
    const text = "## 개요\n이것은 개요 섹션의 내용입니다. 충분히 긴 텍스트가 필요합니다 이상.";
    const chunks = chunkText(text, baseMeta);
    const nonTable = chunks.filter((c) => c.metadata.section !== "table");
    expect(nonTable.length).toBeGreaterThanOrEqual(1);
    expect(nonTable[0].metadata.section).toBeDefined();
  });

  it("빈 문자열 → 빈 배열", () => {
    expect(chunkText("", baseMeta)).toEqual([]);
  });

  it("metadata가 전파됨 (source, sourceId, sourceType)", () => {
    const chunks = chunkText("충분히 긴 텍스트가 있어야 합니다. 최소 20자 이상.", baseMeta);
    if (chunks.length > 0) {
      expect(chunks[0].metadata.source).toBe("test");
      expect(chunks[0].metadata.sourceId).toBe("test-1");
      expect(chunks[0].metadata.sourceType).toBe("document");
    }
  });
});

describe("productToText", () => {
  it("모든 필드 포함 시 전체 포맷팅", () => {
    const text = productToText({
      code: "SG 45N",
      name: "범용 무수축 그라우트",
      description: "범용 그라우트입니다",
      usage: "기계기초",
      scope: "일반 구조물",
      method: "연속 타설",
      properties: [{ name: "압축강도", value: "48", unit: "MPa", standard: "≥45" }],
    });
    expect(text).toContain("SG 45N");
    expect(text).toContain("범용 무수축 그라우트");
    expect(text).toContain("기계기초");
    expect(text).toContain("압축강도: 48 MPa (기준: ≥45)");
  });

  it("null 필드 생략 (undefined 텍스트 없음)", () => {
    const text = productToText({
      code: "ST-100",
      name: "타일압착용",
      description: null,
      usage: null,
    });
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(text).toContain("ST-100");
  });

  it("properties 없으면 물성 섹션 미포함", () => {
    const text = productToText({ code: "X", name: "Y" });
    expect(text).not.toContain("물성 데이터");
  });
});

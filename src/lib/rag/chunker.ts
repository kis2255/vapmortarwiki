/**
 * 문서 텍스트를 검색 가능한 청크로 분할
 */

export interface Chunk {
  content: string;
  metadata: {
    source: string;
    sourceId: string;
    sourceType: "document" | "article" | "product";
    pageNumber?: number;
    section?: string;
  };
}

const CHUNK_SIZE = 800; // 토큰 (대략 한글 400자)
const CHUNK_OVERLAP = 100;

/** 섹션 제목 기준으로 1차 분할 */
function splitBySections(text: string): string[] {
  // Markdown 제목 또는 빈 줄 2개 이상으로 분할
  const sections = text.split(/\n(?=#{1,3}\s)|(?:\n\s*){3,}/);
  return sections.filter((s) => s.trim().length > 0);
}

/** 고정 크기 + 오버랩으로 2차 분할 */
function splitBySize(text: string, maxSize: number, overlap: number): string[] {
  if (text.length <= maxSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxSize;

    // 문장 경계에서 자르기
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + maxSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks;
}

/** 테이블 데이터를 별도 청크로 분리 */
function extractTables(text: string): { tables: string[]; remaining: string } {
  const tableRegex = /\|[^\n]+\|(?:\n\|[^\n]+\|)+/g;
  const tables: string[] = [];
  const remaining = text.replace(tableRegex, (match) => {
    tables.push(match);
    return "\n[TABLE_REMOVED]\n";
  });
  return { tables, remaining };
}

export function chunkText(
  text: string,
  metadata: Omit<Chunk["metadata"], "section">
): Chunk[] {
  const chunks: Chunk[] = [];

  // 테이블을 별도 청크로
  const { tables, remaining } = extractTables(text);
  tables.forEach((table) => {
    chunks.push({
      content: table,
      metadata: { ...metadata, section: "table" },
    });
  });

  // 섹션 분할 → 크기 분할
  const sections = splitBySections(remaining);
  for (const section of sections) {
    const subChunks = splitBySize(section, CHUNK_SIZE, CHUNK_OVERLAP);
    for (const content of subChunks) {
      if (content.replace(/\[TABLE_REMOVED\]/g, "").trim().length < 20) continue;
      chunks.push({
        content,
        metadata: { ...metadata, section: section.slice(0, 50) },
      });
    }
  }

  return chunks;
}

/** 제품 정보를 검색 가능한 텍스트로 변환 */
export function productToText(product: {
  code: string;
  name: string;
  description?: string | null;
  usage?: string | null;
  scope?: string | null;
  method?: string | null;
  properties?: { name: string; unit: string; value: string; standard?: string | null }[];
}): string {
  const parts = [
    `제품: ${product.name} (${product.code})`,
    product.description && `설명: ${product.description}`,
    product.usage && `용도: ${product.usage}`,
    product.scope && `적용범위: ${product.scope}`,
    product.method && `시공방법: ${product.method}`,
  ].filter(Boolean);

  if (product.properties?.length) {
    parts.push("물성 데이터:");
    for (const prop of product.properties) {
      const std = prop.standard ? ` (기준: ${prop.standard})` : "";
      parts.push(`  - ${prop.name}: ${prop.value} ${prop.unit}${std}`);
    }
  }

  return parts.join("\n");
}

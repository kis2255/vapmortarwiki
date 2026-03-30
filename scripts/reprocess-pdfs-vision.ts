/**
 * 기존 PDF를 Gemini Vision으로 재처리하는 스크립트
 * 이미지·그래프·표를 포함한 전체 페이지 분석
 *
 * 실행: npx tsx scripts/reprocess-pdfs-vision.ts
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Vision 추출 (vision-extractor.ts 로직 인라인)
const VISION_MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `당신은 건설/특수몰탈 분야의 기술 문서 분석 전문가입니다.
PDF 문서의 각 페이지를 분석하여 모든 내용을 한국어로 상세히 추출하세요.

## 추출 규칙

### 텍스트
- 모든 텍스트를 빠짐없이 추출
- 영문/일문 내용은 한국어로 번역하되, 기술 용어(MPa, EN 1504, ASTM, pH 등)는 원문 유지
- 제품명, 브랜드명은 원문 유지

### 표(Table)
- 마크다운 테이블 형식으로 정확히 재현
- 수치, 단위, 시험방법 등 모든 셀 값 포함

### 그래프/차트
- 그래프 제목, 축 레이블, 범례를 명시
- 주요 데이터 포인트의 수치를 읽어서 기술
- 트렌드/경향을 한 문장으로 요약
- 예: "압축강도-재령 그래프: 3일 25MPa, 7일 38MPa, 28일 52MPa. 초기 강도 발현이 빠른 경향."

### 사진/이미지
- 시공 사진: 시공 단계, 사용 장비, 시공 부위를 설명
- 제품 사진: 포장 형태, 규격, 외관 설명
- 현미경/단면 사진: 관찰 결과와 의미 설명
- 도면: 치수, 구조, 주요 부위 설명

### 수식
- LaTeX 형식이 아닌 일반 텍스트로 표기

## 출력 형식
페이지별로 아래 형식을 사용하세요:

---PAGE 1---
[이미지 포함 여부: 있음/없음]

(해당 페이지의 모든 내용)

---PAGE 2---
[이미지 포함 여부: 있음/없음]

(해당 페이지의 모든 내용)`;

interface VisionPage {
  pageNumber: number;
  content: string;
  hasImages: boolean;
}

async function extractWithVision(buffer: Buffer): Promise<{
  pages: VisionPage[];
  fullText: string;
  pageCount: number;
}> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");

  const base64 = buffer.toString("base64");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType: "application/pdf", data: base64 } },
              { text: SYSTEM_PROMPT },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 30000, temperature: 0.1 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Vision API error: ${error}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!rawText) throw new Error("Gemini Vision이 빈 응답을 반환");

  const pages = parsePages(rawText);
  return {
    pages,
    fullText: pages.map((p) => p.content).join("\n\n"),
    pageCount: pages.length,
  };
}

function parsePages(raw: string): VisionPage[] {
  const pagePattern = /---PAGE\s*(\d+)---/gi;
  const parts = raw.split(pagePattern);
  const pages: VisionPage[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const pageNum = parseInt(parts[i], 10);
    const content = (parts[i + 1] || "").trim();
    if (!content) continue;

    const hasImages =
      /\[이미지 포함 여부:\s*있음\]/i.test(content) ||
      /그래프|차트|사진|이미지|그림|도면|figure|image|photo/i.test(content);

    const cleanContent = content
      .replace(/\[이미지 포함 여부:\s*(있음|없음)\]\s*/gi, "")
      .trim();

    if (cleanContent.length > 10) {
      pages.push({ pageNumber: pageNum, content: cleanContent, hasImages });
    }
  }

  if (pages.length === 0 && raw.trim().length > 10) {
    pages.push({
      pageNumber: 1,
      content: raw.trim(),
      hasImages: /그래프|차트|사진|이미지|그림|도면|figure|image|photo/i.test(raw),
    });
  }

  return pages;
}

// 청킹 (chunker.ts 로직 인라인)
function chunkText(text: string, source: string, sourceId: string) {
  const CHUNK_SIZE = 800;
  const CHUNK_OVERLAP = 100;
  const chunks: { content: string; metadata: Record<string, unknown> }[] = [];

  // 테이블 분리
  const tableRegex = /\|[^\n]+\|(?:\n\|[^\n]+\|)+/g;
  const tables: string[] = [];
  const remaining = text.replace(tableRegex, (match) => {
    tables.push(match);
    return "\n";
  });

  tables.forEach((table) => {
    chunks.push({
      content: table,
      metadata: { source, sourceId, sourceType: "document", section: "table", visionExtracted: true },
    });
  });

  // 섹션 분할
  const sections = remaining.split(/\n(?=#{1,3}\s)|(?:\n\s*){3,}/).filter((s) => s.trim().length > 0);

  for (const section of sections) {
    if (section.length <= CHUNK_SIZE) {
      if (section.trim().length >= 20) {
        chunks.push({
          content: section.trim(),
          metadata: { source, sourceId, sourceType: "document", section: section.slice(0, 50), visionExtracted: true },
        });
      }
    } else {
      let start = 0;
      while (start < section.length) {
        let end = start + CHUNK_SIZE;
        if (end < section.length) {
          const lastBreak = Math.max(section.lastIndexOf(".", end), section.lastIndexOf("\n", end));
          if (lastBreak > start + CHUNK_SIZE * 0.5) end = lastBreak + 1;
        }
        const chunk = section.slice(start, end).trim();
        if (chunk.length >= 20) {
          chunks.push({
            content: chunk,
            metadata: { source, sourceId, sourceType: "document", section: section.slice(0, 50), visionExtracted: true },
          });
        }
        start = end - CHUNK_OVERLAP;
      }
    }
  }

  return chunks;
}

// 임베딩 생성
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not set");

  if (texts.length > 100) {
    const all: number[][] = [];
    for (let i = 0; i < texts.length; i += 100) {
      const batch = texts.slice(i, i + 100);
      const result = await generateEmbeddings(batch);
      all.push(...result);
    }
    return all;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        })),
      }),
    }
  );

  if (!response.ok) throw new Error(`Embedding API error: ${await response.text()}`);
  const data = await response.json();
  return data.embeddings.map((e: { values: number[] }) => e.values);
}

// ─── 메인 ───

const PDF_DIR = path.resolve(__dirname, "../downloads");

async function main() {
  const files = fs.readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf"));
  console.log(`\n📄 PDF ${files.length}건 Vision 재처리 시작\n`);

  for (const fileName of files) {
    const filePath = path.join(PDF_DIR, fileName);
    const buffer = fs.readFileSync(filePath);
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);

    console.log(`─── ${fileName} (${sizeMB}MB) ───`);

    // 1. 기존 Document 찾기 또는 생성
    let doc = await prisma.document.findFirst({
      where: { fileName: { contains: fileName.replace(".pdf", "") } },
    });

    if (!doc) {
      doc = await prisma.document.create({
        data: {
          fileName,
          filePath: `downloads/${fileName}`,
          fileSize: buffer.length,
          documentType: "OTHER",
          autoClassified: false,
          confirmed: false,
        },
      });
      console.log(`  새 문서 레코드 생성: ${doc.id}`);
    } else {
      console.log(`  기존 문서 발견: ${doc.id}`);
    }

    // 2. 기존 임베딩 삭제
    const deleted = await prisma.embedding.deleteMany({
      where: { documentId: doc.id },
    });
    if (deleted.count > 0) {
      console.log(`  기존 임베딩 ${deleted.count}건 삭제`);
    }

    // 3. Gemini Vision 분석
    try {
      console.log(`  Vision 분석 중...`);
      const vision = await extractWithVision(buffer);
      const imagePages = vision.pages.filter((p) => p.hasImages).length;
      console.log(`  ${vision.pageCount}페이지 분석 완료 (이미지 ${imagePages}페이지)`);

      // 4. extractedText 업데이트
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          extractedText: vision.fullText,
          pageCount: vision.pageCount,
        },
      });

      // 5. 청킹
      const chunks = chunkText(vision.fullText, fileName, doc.id);
      console.log(`  ${chunks.length}개 청크 생성`);

      // 6. 임베딩 생성 + 저장
      if (chunks.length > 0) {
        const vectors = await generateEmbeddings(chunks.map((c) => c.content));
        for (let i = 0; i < chunks.length; i++) {
          const vectorStr = `[${vectors[i].join(",")}]`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO embeddings (id, content, vector, metadata, "documentId", "createdAt")
             VALUES ($1, $2, $3::vector, $4::jsonb, $5, NOW())`,
            `emb-${doc.id}-v-${i}`,
            chunks[i].content,
            vectorStr,
            JSON.stringify(chunks[i].metadata),
            doc.id
          );
        }
        console.log(`  ${chunks.length}개 벡터 임베딩 저장 완료 ✓`);
      }
    } catch (e) {
      console.error(`  ✗ 실패: ${e}`);
    }

    // API rate limit 방지
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n✓ 전체 재처리 완료!\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

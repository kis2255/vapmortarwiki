/**
 * PDF → 페이지 이미지(PNG) → Supabase Storage 업로드 → 위키 문서 자동 생성
 *
 * 각 PDF에 대해:
 *  1. 페이지를 PNG로 렌더링
 *  2. Supabase Storage(pdf-pages 버킷)에 업로드
 *  3. Vision 분석 텍스트 + 이미지 URL로 위키 문서 생성
 *
 * 실행: npx tsx scripts/pdf-to-wiki-with-images.ts
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const PDF_DIR = path.resolve(__dirname, "../downloads");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ─── PDF → PNG 변환 ───

async function pdfToImages(
  pdfPath: string
): Promise<{ page: number; buffer: Buffer }[]> {
  // pdf-to-img는 ESM 전용 → dynamic import
  const { pdf } = await import("pdf-to-img");
  const images: { page: number; buffer: Buffer }[] = [];
  let pageNum = 0;

  const doc = await pdf(pdfPath, { scale: 2.0 });
  for await (const image of doc) {
    pageNum++;
    images.push({ page: pageNum, buffer: Buffer.from(image) });
  }

  return images;
}

// ─── Supabase Storage 업로드 ───

async function uploadImage(
  fileName: string,
  page: number,
  imageBuffer: Buffer
): Promise<string> {
  const safeName = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const storagePath = `${safeName}/page-${page}.png`;

  const { error } = await supabase.storage
    .from("pdf-pages")
    .upload(storagePath, imageBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return `${SUPABASE_URL}/storage/v1/object/public/pdf-pages/${storagePath}`;
}

// ─── Vision 분석 텍스트 가져오기 ───

async function getVisionText(docId: string): Promise<string | null> {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    select: { extractedText: true },
  });
  return doc?.extractedText || null;
}

// ─── 위키 문서 생성 ───

async function createWikiArticle(
  fileName: string,
  imageUrls: { page: number; url: string }[],
  visionText: string
) {
  const title = fileName
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/TDS$/i, "기술자료");

  const slug =
    "pdf-" +
    fileName
      .replace(/\.pdf$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+$/, "");

  // Vision 텍스트를 페이지별로 분할
  const pageTexts = visionText.split(/\n---PAGE\s*\d+---\n/i).filter((t) => t.trim());

  // 마크다운 문서 생성: 이미지 + 분석 텍스트
  let content = `# ${title}\n\n`;
  content += `> 본 문서는 PDF 원본을 AI Vision으로 분석하여 자동 생성되었습니다. 이미지·그래프·표 데이터가 포함되어 있습니다.\n\n`;

  for (let i = 0; i < imageUrls.length; i++) {
    const { page, url } = imageUrls[i];
    const pageText = pageTexts[i] || pageTexts[0] || "";

    content += `## 페이지 ${page}\n\n`;
    content += `![${title} - 페이지 ${page}](${url})\n\n`;

    // 해당 페이지의 Vision 분석 텍스트 추가
    if (pageText.trim()) {
      // 이미지 포함 여부 메타 라인 제거
      const cleanText = pageText
        .replace(/\[이미지 포함 여부:\s*(있음|없음)\]\s*/gi, "")
        .trim();
      if (cleanText) {
        content += `${cleanText}\n\n`;
      }
    }

    content += `---\n\n`;
  }

  // 카테고리 결정: 경쟁사 자료 → market-analysis
  const marketCat = await prisma.category.findUnique({
    where: { slug: "market-analysis" },
  });

  // 기존 문서 확인
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    await prisma.article.update({
      where: { slug },
      data: { content, tags: ["PDF", "이미지", "Vision분석", "경쟁사"] },
    });
    console.log(`  위키 문서 업데이트: ${title}`);

    // 기존 임베딩 삭제 후 재생성
    await prisma.embedding.deleteMany({ where: { articleId: existing.id } });
    await createSearchChunks(existing.id, title, content);
  } else {
    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt: content.slice(0, 200),
        categoryId: marketCat?.id || null,
        tags: ["PDF", "이미지", "Vision분석", "경쟁사"],
        published: true,
        author: "마케팅팀",
      },
    });
    console.log(`  위키 문서 생성: ${title}`);
    await createSearchChunks(article.id, title, content);
  }
}

// ─── 검색용 청크 생성 ───

async function createSearchChunks(
  articleId: string,
  title: string,
  content: string
) {
  const chunks = content
    .split(/\n(?=##?\s)/)
    .filter((c) => c.trim().length > 30);

  for (let i = 0; i < chunks.length; i++) {
    await prisma.embedding.upsert({
      where: { id: `emb-article-${articleId}-${i}` },
      update: { content: chunks[i] },
      create: {
        id: `emb-article-${articleId}-${i}`,
        content: chunks[i],
        metadata: JSON.stringify({
          sourceType: "article",
          title,
          hasImages: true,
        }),
        articleId,
      },
    });
  }
  console.log(`  검색 청크 ${chunks.length}개 저장`);
}

// ─── 메인 ───

async function main() {
  const files = fs.readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf"));
  console.log(`\n📄 PDF ${files.length}건 → 이미지 변환 + 위키 생성\n`);

  for (const fileName of files) {
    const filePath = path.join(PDF_DIR, fileName);
    console.log(`─── ${fileName} ───`);

    // 1. PDF → PNG
    let images: { page: number; buffer: Buffer }[];
    try {
      images = await pdfToImages(filePath);
      console.log(`  ${images.length}페이지 이미지 변환 완료`);
    } catch (e) {
      console.error(`  ✗ 이미지 변환 실패:`, e);
      continue;
    }

    // 2. Supabase Storage 업로드
    const imageUrls: { page: number; url: string }[] = [];
    for (const img of images) {
      try {
        const url = await uploadImage(fileName, img.page, img.buffer);
        imageUrls.push({ page: img.page, url });
      } catch (e) {
        console.error(`  ✗ 페이지 ${img.page} 업로드 실패:`, e);
      }
    }
    console.log(`  ${imageUrls.length}개 이미지 업로드 완료`);

    // 3. Vision 분석 텍스트 가져오기
    const doc = await prisma.document.findFirst({
      where: { fileName: { contains: fileName.replace(".pdf", "") } },
    });

    let visionText = "";
    if (doc?.extractedText) {
      visionText = doc.extractedText;
    } else {
      console.log(`  ⚠ Vision 텍스트 없음, 이미지만 포함`);
    }

    // 4. 위키 문서 생성
    await createWikiArticle(fileName, imageUrls, visionText);

    console.log(`  ✓ 완료\n`);
  }

  console.log(`\n✓ 전체 완료!\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

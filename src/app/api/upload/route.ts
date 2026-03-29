import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/db/prisma";
import { extractTextFromPdf } from "@/lib/pdf/extractor";
import { classifyDocument } from "@/lib/pdf/classifier";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embedder";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const confirmedType = formData.get("documentType") as string | null;
    const productId = formData.get("productId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 필요합니다" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF 파일만 업로드 가능합니다" }, { status: 400 });
    }

    // 1. 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
    const filePath = `uploads/${timestamp}_${safeFileName}`;
    await writeFile(join(process.cwd(), "public", filePath), buffer);

    // 2. 텍스트 추출
    let extractedText = "";
    let pageCount = 0;
    try {
      const extracted = await extractTextFromPdf(buffer);
      extractedText = extracted.text;
      pageCount = extracted.pageCount;
    } catch (e) {
      console.warn("PDF 텍스트 추출 실패:", e);
    }

    // 3. 자동 분류
    const classification = classifyDocument(file.name, extractedText);
    const documentType = confirmedType || classification.type;

    // 4. DB 저장
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        filePath,
        fileSize: file.size,
        documentType,
        autoClassified: !confirmedType,
        confirmed: !!confirmedType,
        extractedText: extractedText || null,
        pageCount,
        productId: productId || null,
      },
    });

    // 5. 임베딩 생성 (OpenAI 키가 있고 텍스트가 있는 경우)
    let embeddingCount = 0;
    if (extractedText && extractedText.length > 50 && process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        const chunks = chunkText(extractedText, {
          source: file.name,
          sourceId: document.id,
          sourceType: "document",
        });

        if (chunks.length > 0) {
          const vectors = await generateEmbeddings(chunks.map((c) => c.content));

          for (let i = 0; i < chunks.length; i++) {
            const vectorStr = `[${vectors[i].join(",")}]`;
            await prisma.$executeRawUnsafe(
              `INSERT INTO embeddings (id, content, vector, metadata, "documentId", "createdAt")
               VALUES ($1, $2, $3::vector, $4::jsonb, $5, NOW())`,
              `emb-${document.id}-${i}`,
              chunks[i].content,
              vectorStr,
              JSON.stringify(chunks[i].metadata),
              document.id
            );
          }
          embeddingCount = chunks.length;
        }
      } catch (e) {
        console.warn("임베딩 생성 실패:", e);
      }
    }

    // 임베딩 없이도 키워드 검색용 청크 저장
    if (embeddingCount === 0 && extractedText && extractedText.length > 50) {
      const chunks = chunkText(extractedText, {
        source: file.name,
        sourceId: document.id,
        sourceType: "document",
      });
      for (let i = 0; i < Math.min(chunks.length, 50); i++) {
        await prisma.embedding.create({
          data: {
            id: `emb-${document.id}-${i}`,
            content: chunks[i].content,
            metadata: JSON.stringify(chunks[i].metadata),
            documentId: document.id,
          },
        });
      }
      embeddingCount = Math.min(chunks.length, 50);
    }

    return NextResponse.json({
      id: document.id,
      fileName: document.fileName,
      documentType: document.documentType,
      autoClassified: document.autoClassified,
      classification: {
        type: classification.type,
        confidence: classification.confidence,
        method: classification.method,
      },
      pageCount,
      embeddingCount,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}

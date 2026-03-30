import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractTextFromPdf } from "@/lib/pdf/extractor";
import { extractWithVision } from "@/lib/pdf/vision-extractor";
import { classifyDocument } from "@/lib/pdf/classifier";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embedder";
import { translateChunks } from "@/lib/rag/translator";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const confirmedType = formData.get("documentType") as string | null;
    const productId = formData.get("productId") as string | null;
    const useVision = formData.get("useVision") !== "false"; // 기본값: true

    if (!file) return NextResponse.json({ error: "파일이 필요합니다" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "PDF만 가능" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
    const filePath = `${timestamp}_${safeFileName}`;

    // 1. 텍스트 추출
    let extractedText = "";
    let pageCount = 0;
    let visionUsed = false;
    let visionPages: { pageNumber: number; hasImages: boolean }[] = [];

    // Vision 모드: PDF를 Gemini Vision으로 페이지 단위 분석
    if (useVision && process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        console.log(`[Vision] ${file.name}: Gemini Vision 분석 시작`);
        const visionResult = await extractWithVision(buffer);
        extractedText = visionResult.fullText;
        pageCount = visionResult.pageCount;
        visionUsed = true;
        visionPages = visionResult.pages.map((p) => ({
          pageNumber: p.pageNumber,
          hasImages: p.hasImages,
        }));
        console.log(
          `[Vision] 완료: ${pageCount}페이지, 이미지 포함 ${visionPages.filter((p) => p.hasImages).length}페이지`
        );
      } catch (e) {
        console.warn("[Vision] 실패, 텍스트 추출로 폴백:", e);
      }
    }

    // Vision 실패 또는 비활성 → 기존 텍스트 추출
    if (!visionUsed) {
      try {
        const extracted = await extractTextFromPdf(buffer);
        extractedText = extracted.text;
        pageCount = extracted.pageCount;
      } catch (e) {
        console.warn("PDF 텍스트 추출 실패:", e);
      }
    }

    // 2. 자동 분류
    const classification = classifyDocument(file.name, extractedText);
    const documentType = confirmedType || classification.type;

    // 3. DB 저장
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

    // 4. 청킹 + 임베딩
    let embeddingCount = 0;
    if (extractedText && extractedText.length > 50) {
      const chunks = chunkText(extractedText, {
        source: file.name,
        sourceId: document.id,
        sourceType: "document",
      });

      // Vision 모드에서는 이미 한국어로 변환됨 → 번역 불필요
      const koreanRatio = (extractedText.match(/[가-힣]/g) || []).length / extractedText.length;
      const needsTranslation = !visionUsed && koreanRatio < 0.3;

      let translatedContents = chunks.map((c) => c.content);
      if (needsTranslation && process.env.GOOGLE_GEMINI_API_KEY) {
        try {
          console.log(`[번역] ${file.name}: ${chunks.length}개 청크 번역 시작`);
          translatedContents = await translateChunks(
            chunks.map((c) => c.content),
            5
          );
          console.log(`[번역] 완료`);
        } catch (e) {
          console.warn("번역 실패, 원문 사용:", e);
        }
      }

      // 5. 임베딩 생성
      if (process.env.GOOGLE_GEMINI_API_KEY && chunks.length > 0) {
        try {
          const vectors = await generateEmbeddings(translatedContents);
          for (let i = 0; i < chunks.length; i++) {
            const vectorStr = `[${vectors[i].join(",")}]`;
            const metadata = {
              ...chunks[i].metadata,
              ...(needsTranslation ? { originalText: chunks[i].content.slice(0, 500) } : {}),
              translated: needsTranslation,
              visionExtracted: visionUsed,
            };
            await prisma.$executeRawUnsafe(
              `INSERT INTO embeddings (id, content, vector, metadata, "documentId", "createdAt")
               VALUES ($1, $2, $3::vector, $4::jsonb, $5, NOW())`,
              `emb-${document.id}-${i}`,
              translatedContents[i],
              vectorStr,
              JSON.stringify(metadata),
              document.id
            );
          }
          embeddingCount = chunks.length;
        } catch (e) {
          console.warn("임베딩 생성 실패:", e);
        }
      }

      // 임베딩 없으면 키워드 검색용 저장
      if (embeddingCount === 0) {
        for (let i = 0; i < Math.min(chunks.length, 50); i++) {
          await prisma.embedding.create({
            data: {
              id: `emb-${document.id}-${i}`,
              content: translatedContents[i],
              metadata: { ...chunks[i].metadata, translated: needsTranslation, visionExtracted: visionUsed },
              documentId: document.id,
            },
          });
        }
        embeddingCount = Math.min(chunks.length, 50);
      }
    }

    return NextResponse.json({
      id: document.id,
      fileName: document.fileName,
      documentType: document.documentType,
      classification: { type: classification.type, confidence: classification.confidence, method: classification.method },
      pageCount,
      embeddingCount,
      translated: !visionUsed && (extractedText.match(/[가-힣]/g) || []).length / Math.max(extractedText.length, 1) < 0.3,
      visionUsed,
      visionPages: visionUsed ? visionPages : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}

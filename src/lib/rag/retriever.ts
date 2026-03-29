/**
 * 하이브리드 검색: pgvector 코사인 유사도 + 키워드 매칭
 */

import { prisma } from "@/lib/db/prisma";
import { generateEmbedding } from "./embedder";

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  source: {
    type: "document" | "article" | "product";
    id: string;
    title: string;
    slug?: string;
  };
  metadata: Record<string, unknown> | null;
}

/** pgvector 코사인 유사도 검색 */
async function vectorSearch(
  query: string,
  limit: number = 10
): Promise<RetrievedChunk[]> {
  const embedding = await generateEmbedding(query);
  const vectorStr = `[${embedding.join(",")}]`;

  const results = await prisma.$queryRawUnsafe<
    {
      id: string;
      content: string;
      score: number;
      metadata: Record<string, unknown> | null;
      documentId: string | null;
      articleId: string | null;
      productId: string | null;
    }[]
  >(
    `SELECT id, content, metadata, "documentId", "articleId", "productId",
            1 - (vector <=> $1::vector) as score
     FROM embeddings
     WHERE vector IS NOT NULL
     ORDER BY vector <=> $1::vector
     LIMIT $2`,
    vectorStr,
    limit
  );

  // 후처리: 출처 ID로 제목/slug 조회
  const docIds = results.filter((r) => r.documentId).map((r) => r.documentId!);
  const artIds = results.filter((r) => r.articleId).map((r) => r.articleId!);
  const prodIds = results.filter((r) => r.productId).map((r) => r.productId!);

  const [docs, arts, prods] = await Promise.all([
    docIds.length > 0 ? prisma.document.findMany({ where: { id: { in: docIds } }, select: { id: true, fileName: true } }) : [],
    artIds.length > 0 ? prisma.article.findMany({ where: { id: { in: artIds } }, select: { id: true, title: true, slug: true } }) : [],
    prodIds.length > 0 ? prisma.product.findMany({ where: { id: { in: prodIds } }, select: { id: true, name: true, code: true } }) : [],
  ]);

  const docMap = new Map(docs.map((d) => [d.id, d.fileName]));
  const artMap = new Map(arts.map((a) => [a.id, { title: a.title, slug: a.slug }]));
  const prodMap = new Map(prods.map((p) => [p.id, `${p.name} (${p.code})`]));

  return results.map((r) => ({
    id: r.id,
    content: r.content,
    score: Number(r.score),
    source: {
      type: r.documentId ? "document" : r.articleId ? "article" : "product",
      id: (r.documentId || r.articleId || r.productId)!,
      title: r.documentId
        ? docMap.get(r.documentId) || ""
        : r.articleId
          ? artMap.get(r.articleId)?.title || ""
          : prodMap.get(r.productId!) || "",
      slug: r.articleId ? artMap.get(r.articleId)?.slug : undefined,
    },
    metadata: r.metadata,
  }));
}

/** 키워드 기반 전문검색 */
async function keywordSearch(
  query: string,
  limit: number = 10
): Promise<RetrievedChunk[]> {
  const keywords = query.split(/\s+/).filter((k) => k.length >= 2);
  const conditions = keywords.length > 0
    ? keywords.map((k) => ({ content: { contains: k, mode: "insensitive" as const } }))
    : [{ content: { contains: query, mode: "insensitive" as const } }];

  const results = await prisma.embedding.findMany({
    where: { OR: conditions },
    take: limit,
    include: {
      document: { select: { id: true, fileName: true } },
      article: { select: { id: true, title: true, slug: true } },
      product: { select: { id: true, name: true, code: true } },
    },
  });

  return results.map((r) => ({
    id: r.id,
    content: r.content,
    score: 0.5,
    source: {
      type: r.documentId ? "document" : r.articleId ? "article" : "product",
      id: (r.documentId || r.articleId || r.productId)!,
      title:
        r.document?.fileName ||
        r.article?.title ||
        (r.product ? `${r.product.name} (${r.product.code})` : ""),
      slug: r.article?.slug,
    },
    metadata: r.metadata as Record<string, unknown> | null,
  }));
}

/** 제품 물성 데이터 직접 조회 */
export async function lookupProductData(query: string) {
  const codeMatch = query.match(/[A-Z]{1,3}-?\d{2,4}/i);

  const products = await prisma.product.findMany({
    where: codeMatch
      ? { code: { contains: codeMatch[0], mode: "insensitive" } }
      : {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
          ],
        },
    include: {
      properties: true,
      category: true,
      standards: { include: { standard: true } },
    },
    take: 5,
  });

  return products;
}

/** 하이브리드 검색: Vector + Keyword 결합 */
export async function hybridSearch(
  query: string,
  limit: number = 10
): Promise<RetrievedChunk[]> {
  const hasEmbeddingKey = !!process.env.GOOGLE_GEMINI_API_KEY;

  const [vectorResults, keywordResults] = await Promise.all([
    hasEmbeddingKey
      ? vectorSearch(query, limit).catch(() => [] as RetrievedChunk[])
      : Promise.resolve([]),
    keywordSearch(query, limit),
  ]);

  const scoreMap = new Map<string, RetrievedChunk>();

  for (const chunk of vectorResults) {
    scoreMap.set(chunk.id, { ...chunk, score: chunk.score * 0.7 });
  }

  for (const chunk of keywordResults) {
    const existing = scoreMap.get(chunk.id);
    if (existing) {
      existing.score += chunk.score * 0.3;
    } else {
      scoreMap.set(chunk.id, { ...chunk, score: chunk.score * 0.3 });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

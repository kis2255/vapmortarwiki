/**
 * 하이브리드 검색: 벡터 코사인 유사도 + 키워드 매칭
 * SQLite 모드: 벡터를 JSON 문자열로 저장, JS에서 코사인 유사도 계산
 * PostgreSQL+pgvector 모드: DB 레벨 벡터 검색 (추후 전환)
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
  };
  metadata: Record<string, unknown> | null;
}

/** 코사인 유사도 계산 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** 벡터 유사도 검색 (SQLite용: JS에서 계산) */
async function vectorSearch(
  query: string,
  limit: number = 10
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(query);

  const allEmbeddings = await prisma.embedding.findMany({
    where: { vector: { not: null } },
    include: {
      document: { select: { id: true, fileName: true } },
      article: { select: { id: true, title: true } },
      product: { select: { id: true, name: true, code: true } },
    },
  });

  const scored = allEmbeddings
    .map((emb) => {
      const vector = JSON.parse(emb.vector!) as number[];
      const score = cosineSimilarity(queryEmbedding, vector);
      return { emb, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ emb, score }) => ({
    id: emb.id,
    content: emb.content,
    score,
    source: {
      type: emb.documentId ? "document" : emb.articleId ? "article" : "product",
      id: (emb.documentId || emb.articleId || emb.productId)!,
      title:
        emb.document?.fileName ||
        emb.article?.title ||
        (emb.product ? `${emb.product.name} (${emb.product.code})` : ""),
    },
    metadata: emb.metadata ? JSON.parse(emb.metadata) : null,
  }));
}

/** 키워드 기반 전문검색 */
async function keywordSearch(
  query: string,
  limit: number = 10
): Promise<RetrievedChunk[]> {
  // 쿼리를 단어로 분리하여 OR 검색
  const keywords = query.split(/\s+/).filter((k) => k.length >= 2);
  const conditions = keywords.length > 0
    ? keywords.map((k) => ({ content: { contains: k } }))
    : [{ content: { contains: query } }];

  const results = await prisma.embedding.findMany({
    where: { OR: conditions },
    take: limit,
    include: {
      document: { select: { id: true, fileName: true } },
      article: { select: { id: true, title: true } },
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
    },
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
  }));
}

/** 제품 물성 데이터 직접 조회 (정확한 수치) */
export async function lookupProductData(query: string) {
  const codeMatch = query.match(/[A-Z]{1,3}-?\d{2,4}/i);

  const products = await prisma.product.findMany({
    where: codeMatch
      ? { code: { contains: codeMatch[0] } }
      : {
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
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
    hasEmbeddingKey ? vectorSearch(query, limit).catch(() => [] as RetrievedChunk[]) : Promise.resolve([]),
    keywordSearch(query, limit),
  ]);

  // 중복 제거 및 점수 합산
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

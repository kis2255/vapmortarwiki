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

/** 한국어 질문에서 검색 키워드 추출 */
function extractKeywords(query: string): string[] {
  // 어미/조사를 단어 경계에서만 제거 (단어 중간의 글자는 보존)
  const cleaned = query
    .replace(/[?？!~.,;:'"()（）\[\]{}]/g, " ")
    .replace(/(은|는|이|가|을|를|에서|에게|으로|로서|에는|이란|란|이요|해줘|해주세요|알려줘|알려주세요|뭐야|인가요|인가|입니까|인지|할까|할까요|하세요|해봐|좀|요|과|와|의|로|도)$/g, " ")
    .replace(/\s(은|는|이|가|을|를|에서|에게|으로|로서|에는|과|와|의)\s/g, " ");
  const keywords = cleaned.split(/\s+/).filter((k) => k.length >= 2);
  return keywords.length > 0 ? keywords : [query.trim()];
}

/** 키워드 기반 전문검색 (ILIKE 다중 키워드 OR - 한국어 지원) */
async function keywordSearch(
  query: string,
  limit: number = 10
): Promise<RetrievedChunk[]> {
  const keywords = extractKeywords(query);

  // 모든 키워드를 ILIKE OR로 검색 (더 넓은 매칭)
  const conditions = keywords
    .slice(0, 5) // 최대 5개 키워드
    .map((k) => `content ILIKE '%${k.replace(/'/g, "''")}%'`)
    .join(" OR ");

  const results = await prisma.$queryRawUnsafe<
    {
      id: string;
      content: string;
      documentId: string | null;
      articleId: string | null;
      productId: string | null;
    }[]
  >(
    `SELECT id, content, "documentId", "articleId", "productId"
     FROM embeddings WHERE ${conditions}
     ORDER BY LENGTH(content) ASC
     LIMIT ${limit * 3}`
  );

  // 매칭 키워드 수 기반 점수 계산 + 정렬
  const scored = results.map((r) => {
    const matchCount = keywords.filter((k) =>
      r.content.toLowerCase().includes(k.toLowerCase())
    ).length;
    return { ...r, matchCount };
  });
  scored.sort((a, b) => b.matchCount - a.matchCount);
  const sliced = scored.slice(0, limit);

  // 출처 정보 후처리
  const docIds = sliced.filter((r) => r.documentId).map((r) => r.documentId!);
  const artIds = sliced.filter((r) => r.articleId).map((r) => r.articleId!);
  const prodIds = sliced.filter((r) => r.productId).map((r) => r.productId!);

  const [docs, arts, prods] = await Promise.all([
    docIds.length > 0 ? prisma.document.findMany({ where: { id: { in: docIds } }, select: { id: true, fileName: true } }) : [],
    artIds.length > 0 ? prisma.article.findMany({ where: { id: { in: artIds } }, select: { id: true, title: true, slug: true } }) : [],
    prodIds.length > 0 ? prisma.product.findMany({ where: { id: { in: prodIds } }, select: { id: true, name: true, code: true } }) : [],
  ]);

  const docMap = new Map(docs.map((d) => [d.id, d.fileName]));
  const artMap = new Map(arts.map((a) => [a.id, { title: a.title, slug: a.slug }]));
  const prodMap = new Map(prods.map((p) => [p.id, `${p.name} (${p.code})`]));

  return sliced.map((r) => ({
    id: r.id,
    content: r.content,
    score: 0.3 + (r.matchCount / keywords.length) * 0.7, // 매칭 비율 기반 점수
    source: {
      type: r.documentId ? "document" : r.articleId ? "article" : "product",
      id: (r.documentId || r.articleId || r.productId)!,
      title: r.documentId ? docMap.get(r.documentId) || ""
        : r.articleId ? artMap.get(r.articleId)?.title || ""
        : prodMap.get(r.productId!) || "",
      slug: r.articleId ? artMap.get(r.articleId)?.slug : undefined,
    },
    metadata: null,
  }));
}

/** 제품 물성 데이터 직접 조회 */
export async function lookupProductData(query: string) {
  // 여러 제품 코드를 모두 추출 (RM-100, RM-200 등)
  const codeMatches = [...query.matchAll(/[A-Z]{1,3}-?\d{2,4}\w*/gi)].map((m) => m[0]);

  if (codeMatches.length > 0) {
    return prisma.product.findMany({
      where: { OR: codeMatches.map((code) => ({ code: { contains: code, mode: "insensitive" as const } })) },
      include: { properties: true, category: true, standards: { include: { standard: true } } },
      take: 5,
    });
  }

  // 키워드 분리 후 각각 검색 (전체 쿼리 대신 개별 키워드)
  const keywords = extractKeywords(query);
  const conditions = keywords.flatMap((kw) => [
    { name: { contains: kw, mode: "insensitive" as const } },
    { code: { contains: kw, mode: "insensitive" as const } },
    { usage: { contains: kw, mode: "insensitive" as const } },
    { description: { contains: kw, mode: "insensitive" as const } },
    { category: { name: { contains: kw, mode: "insensitive" as const } } },
  ]);

  return prisma.product.findMany({
    where: { OR: conditions },
    include: { properties: true, category: true, standards: { include: { standard: true } } },
    take: 5,
  });
}

/** 하이브리드 검색: Vector + Keyword 결합 */
export async function hybridSearch(
  query: string,
  limit: number = 10
): Promise<RetrievedChunk[]> {
  const hasEmbeddingKey = !!process.env.GOOGLE_GEMINI_API_KEY;

  const [vectorResults, keywordResults] = await Promise.all([
    hasEmbeddingKey
      ? vectorSearch(query, limit).catch((e) => { console.warn("[vector search error]", e.message?.slice(0, 100)); return [] as RetrievedChunk[]; })
      : Promise.resolve([]),
    keywordSearch(query, limit).catch((e) => { console.warn("[keyword search error]", e.message?.slice(0, 100)); return [] as RetrievedChunk[]; }),
  ]);

  console.log(`[hybridSearch] query="${query}" vector=${vectorResults.length} keyword=${keywordResults.length}`);

  const scoreMap = new Map<string, RetrievedChunk>();

  // 키워드 매칭이 더 신뢰성 높음 (한국어 정확 매칭)
  for (const chunk of keywordResults) {
    scoreMap.set(chunk.id, { ...chunk, score: 0.8 });
  }

  for (const chunk of vectorResults) {
    const existing = scoreMap.get(chunk.id);
    if (existing) {
      existing.score = Math.min(existing.score + chunk.score * 0.3, 1.0);
    } else {
      scoreMap.set(chunk.id, { ...chunk, score: chunk.score * 0.5 });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

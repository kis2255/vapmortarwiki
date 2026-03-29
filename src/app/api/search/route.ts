import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") || "all";

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const like = `%${query}%`;
  const results: {
    type: string;
    id: string;
    title: string;
    excerpt: string;
    meta?: Record<string, string>;
  }[] = [];

  // 제품 검색
  if (type === "all" || type === "products") {
    const products = await prisma.$queryRaw<
      { id: string; name: string; code: string; description: string | null; usage: string | null; cat_name: string }[]
    >(Prisma.sql`
      SELECT p.id, p.name, p.code, p.description, p.usage, c.name as cat_name
      FROM products p JOIN categories c ON p."categoryId" = c.id
      WHERE p.name LIKE ${like} OR p.code LIKE ${like} OR p.description LIKE ${like} OR p.usage LIKE ${like}
         OR p.id IN (SELECT "productId" FROM product_properties WHERE name LIKE ${like})
      LIMIT 10
    `);
    for (const p of products) {
      results.push({
        type: "product",
        id: p.id,
        title: `${p.name} (${p.code})`,
        excerpt: p.description?.slice(0, 100) || p.usage || "",
        meta: { category: p.cat_name },
      });
    }
  }

  // 위키 문서 검색
  if (type === "all" || type === "articles") {
    const articles = await prisma.$queryRaw<
      { id: string; title: string; slug: string; excerpt: string | null; content: string }[]
    >(Prisma.sql`
      SELECT id, title, slug, excerpt, content FROM articles
      WHERE published = true AND (title LIKE ${like} OR content LIKE ${like})
      LIMIT 10
    `);
    for (const a of articles) {
      results.push({
        type: "article",
        id: a.slug,
        title: a.title,
        excerpt: a.excerpt || a.content.slice(0, 100),
      });
    }
  }

  // PDF 문서 검색
  if (type === "all" || type === "documents") {
    const documents = await prisma.$queryRaw<
      { id: string; fileName: string; documentType: string; extractedText: string | null }[]
    >(Prisma.sql`
      SELECT id, "fileName", "documentType", "extractedText" FROM documents
      WHERE "fileName" LIKE ${like} OR "extractedText" LIKE ${like}
      LIMIT 10
    `);
    for (const d of documents) {
      results.push({
        type: "document",
        id: d.id,
        title: d.fileName,
        excerpt: d.extractedText?.slice(0, 100) || "",
        meta: { documentType: d.documentType },
      });
    }
  }

  // 규격 검색
  if (type === "all" || type === "standards") {
    const standards = await prisma.$queryRaw<
      { id: string; code: string; name: string; description: string | null }[]
    >(Prisma.sql`
      SELECT id, code, name, description FROM standards
      WHERE code LIKE ${like} OR name LIKE ${like} OR description LIKE ${like}
      LIMIT 10
    `);
    for (const s of standards) {
      results.push({
        type: "standard",
        id: s.id,
        title: `${s.code} ${s.name}`,
        excerpt: s.description?.slice(0, 100) || "",
      });
    }
  }

  return NextResponse.json({ results, total: results.length });
}

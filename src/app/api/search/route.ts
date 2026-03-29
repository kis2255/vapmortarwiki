import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") || "all";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results: {
    type: string;
    id: string;
    title: string;
    excerpt: string;
    meta?: Record<string, string>;
  }[] = [];

  // 제품 검색
  if (type === "all" || type === "products") {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "default" } },
          { code: { contains: query, mode: "default" } },
          { description: { contains: query, mode: "default" } },
        ],
      },
      include: { category: true },
      take: 10,
    });

    for (const p of products) {
      results.push({
        type: "product",
        id: p.id,
        title: `${p.name} (${p.code})`,
        excerpt: p.description?.slice(0, 100) || p.usage || "",
        meta: { category: p.category.name },
      });
    }
  }

  // 위키 문서 검색
  if (type === "all" || type === "articles") {
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "default" } },
          { content: { contains: query, mode: "default" } },
          { tags: { contains: query } },
        ],
        published: true,
      },
      take: 10,
    });

    for (const a of articles) {
      results.push({
        type: "article",
        id: a.id,
        title: a.title,
        excerpt: a.excerpt || a.content.slice(0, 100),
      });
    }
  }

  // PDF 문서 검색
  if (type === "all" || type === "documents") {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { fileName: { contains: query, mode: "default" } },
          { extractedText: { contains: query, mode: "default" } },
        ],
      },
      take: 10,
    });

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
    const standards = await prisma.standard.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: "default" } },
          { name: { contains: query, mode: "default" } },
        ],
      },
      take: 10,
    });

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

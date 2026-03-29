import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embedder";

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  // SQLite: tags를 JSON 파싱
  const parsed = articles.map((a) => ({
    ...a,
    tags: a.tags ? JSON.parse(a.tags) : [],
  }));

  return NextResponse.json(parsed);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let slug = slugify(body.title);
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    let categoryId: string | null = null;
    if (body.categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
      categoryId = cat?.id || null;
    }

    const article = await prisma.article.create({
      data: {
        title: body.title,
        slug,
        content: body.content,
        excerpt: body.content.slice(0, 200),
        categoryId,
        tags: JSON.stringify(body.tags || []),
        published: true,
        author: body.author || "마케팅팀",
      },
    });

    // 키워드 검색용 청크 저장
    if (body.content && body.content.length > 50) {
      const chunks = chunkText(body.content, {
        source: body.title,
        sourceId: article.id,
        sourceType: "article",
      });

      // 임베딩 (OpenAI 키 있으면)
      if (process.env.GOOGLE_GEMINI_API_KEY && chunks.length > 0) {
        try {
          const vectors = await generateEmbeddings(chunks.map((c) => c.content));
          for (let i = 0; i < chunks.length; i++) {
            await prisma.embedding.create({
              data: {
                id: `emb-${article.id}-${i}`,
                content: chunks[i].content,
                vector: JSON.stringify(vectors[i]),
                metadata: JSON.stringify(chunks[i].metadata),
                articleId: article.id,
              },
            });
          }
        } catch (e) {
          console.warn("임베딩 생성 실패:", e);
        }
      } else {
        // 키워드 검색용만 저장
        for (let i = 0; i < chunks.length; i++) {
          await prisma.embedding.create({
            data: {
              id: `emb-${article.id}-${i}`,
              content: chunks[i].content,
              metadata: JSON.stringify(chunks[i].metadata),
              articleId: article.id,
            },
          });
        }
      }
    }

    return NextResponse.json({ ...article, tags: JSON.parse(article.tags) }, { status: 201 });
  } catch (error) {
    console.error("Article create error:", error);
    return NextResponse.json({ error: "문서 작성 실패" }, { status: 500 });
  }
}

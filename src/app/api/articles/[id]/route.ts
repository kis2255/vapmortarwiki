import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.article.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { category: true },
  });

  if (!article) {
    return NextResponse.json({ error: "문서를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const article = await prisma.article.findFirst({
    where: { OR: [{ id }, { slug: id }] },
  });
  if (!article) {
    return NextResponse.json({ error: "문서를 찾을 수 없습니다" }, { status: 404 });
  }

  let categoryId: string | null = article.categoryId;
  if (body.categorySlug !== undefined) {
    if (body.categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
      categoryId = cat?.id || null;
    } else {
      categoryId = null;
    }
  }

  const updated = await prisma.article.update({
    where: { id: article.id },
    data: {
      title: body.title || article.title,
      content: body.content || article.content,
      excerpt: body.content?.slice(0, 200) || article.excerpt,
      tags: body.tags || article.tags,
      categoryId,
      version: article.version + 1,
    },
  });

  return NextResponse.json(updated);
}

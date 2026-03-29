import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // id 또는 slug로 검색
  const article = await prisma.article.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: { category: true },
  });

  if (!article) {
    return NextResponse.json({ error: "문서를 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(article);
}

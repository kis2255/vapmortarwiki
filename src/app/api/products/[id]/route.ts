import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      properties: { orderBy: { name: "asc" } },
      standards: { include: { standard: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "제품을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(product);
}

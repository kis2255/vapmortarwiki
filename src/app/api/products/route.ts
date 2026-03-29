import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const categorySlug = req.nextUrl.searchParams.get("category");
  const search = req.nextUrl.searchParams.get("q");

  const products = await prisma.product.findMany({
    where: {
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    },
    include: {
      category: true,
      standards: { include: { standard: true } },
      _count: { select: { properties: true, documents: true } },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const category = await prisma.category.findUnique({
      where: { slug: body.categorySlug },
    });
    if (!category) {
      return NextResponse.json({ error: "카테고리를 찾을 수 없습니다" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        code: body.code,
        name: body.name,
        categoryId: category.id,
        description: body.description || null,
        usage: body.usage || null,
        scope: body.scope || null,
        mixRatio: body.mixRatio || null,
        method: body.method || null,
        curing: body.curing || null,
        packaging: body.packaging || null,
        properties: {
          create: (body.properties || []).map(
            (p: { name: string; unit: string; standard: string; value: string; testMethod: string }) => ({
              name: p.name,
              unit: p.unit,
              standard: p.standard || null,
              value: p.value,
              testMethod: p.testMethod || null,
              passed: true,
            })
          ),
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "제품 등록 실패" }, { status: 500 });
  }
}

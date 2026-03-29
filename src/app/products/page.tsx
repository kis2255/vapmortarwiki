import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      ...(category && { category: { slug: category } }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "default" as const } },
          { code: { contains: q, mode: "default" as const } },
        ],
      }),
    },
    include: {
      category: true,
      standards: { include: { standard: true } },
    },
    orderBy: { code: "asc" },
  });

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">제품 DB</h1>
          <p className="text-sm text-[var(--color-muted)]">
            등록된 특수몰탈 제품 {products.length}건
          </p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)]"
        >
          <Plus size={14} />
          제품 등록
        </Link>
      </div>

      {/* 필터 */}
      <form className="mb-4 flex flex-wrap gap-2">
        <select
          name="category"
          defaultValue={category || ""}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-1.5 text-sm"
        >
          <option value="">전체 카테고리</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          name="q"
          type="text"
          defaultValue={q || ""}
          placeholder="제품명 또는 코드 검색..."
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm text-white"
        >
          검색
        </button>
      </form>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-sidebar)]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">제품코드</th>
              <th className="px-4 py-3 text-left font-semibold">제품명</th>
              <th className="px-4 py-3 text-left font-semibold">카테고리</th>
              <th className="px-4 py-3 text-left font-semibold">용도</th>
              <th className="px-4 py-3 text-left font-semibold">규격</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-muted)]">
                  {q || category
                    ? "검색 결과가 없습니다."
                    : "등록된 제품이 없습니다. 제품을 등록해 주세요."}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-sidebar)]/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {product.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[var(--color-sidebar)] px-2 py-0.5 text-xs">
                      {product.category.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {product.usage || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {product.standards.map((s) => s.standard.code).join(", ") || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

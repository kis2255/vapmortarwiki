import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { CategoryBadge } from "@/components/ui/category-badge";

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
          { name: { contains: q, mode: "insensitive" as const } },
          { code: { contains: q, mode: "insensitive" as const } },
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
          <h1 className="text-xl font-bold tracking-tight">제품 DB</h1>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            등록된 특수몰탈 제품 {products.length}건
          </p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Plus size={14} />
          제품 등록
        </Link>
      </div>

      {/* 필터 */}
      <form className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <select
          name="category"
          defaultValue={category || ""}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-1.5 text-[13px] outline-none focus:border-[var(--color-primary)]"
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
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-1.5 text-[13px] outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          검색
        </button>
      </form>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-sidebar)]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">제품코드</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">제품명</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">카테고리</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">용도</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">규격</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[var(--color-muted)]">
                  {q || category
                    ? "검색 결과가 없습니다."
                    : "등록된 제품이 없습니다."}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="group border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${product.id}`}
                      className="font-mono text-[13px] font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      {product.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">
                    <CategoryBadge name={product.category.name} slug={product.category.slug} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {product.usage || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {product.standards.length > 0 ? (
                      <span className="font-mono text-[11px] font-medium text-cyan-700">
                        {product.standards.map((s) => s.standard.code).join(", ")}
                      </span>
                    ) : (
                      <span className="text-[var(--color-muted)]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ArrowRight size={14} className="text-[var(--color-border)] transition-colors group-hover:text-[var(--color-primary)]" />
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

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StandardsPage() {
  const standards = await prisma.standard.findMany({
    include: {
      products: {
        include: { product: { select: { id: true, name: true, code: true } } },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">KS 규격 및 표준 목록</h1>
        <p className="text-sm text-[var(--color-muted)]">
          등록된 규격 {standards.length}건
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-sidebar)]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">규격번호</th>
              <th className="px-4 py-3 text-left font-semibold">규격명</th>
              <th className="px-4 py-3 text-left font-semibold">분류</th>
              <th className="px-4 py-3 text-left font-semibold">관련 제품</th>
            </tr>
          </thead>
          <tbody>
            {standards.map((std) => (
              <tr
                key={std.id}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-sidebar)]/50"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-[var(--color-primary)]">
                    {std.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>{std.name}</div>
                  {std.description && (
                    <div className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {std.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[var(--color-sidebar)] px-2 py-0.5 text-xs">
                    {std.category || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {std.products.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {std.products.map((ps) => (
                        <Link
                          key={ps.product.id}
                          href={`/products/${ps.product.id}`}
                          className="inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] px-2 py-0.5 text-xs hover:bg-[var(--color-sidebar)]"
                        >
                          <ExternalLink size={10} />
                          {ps.product.code}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

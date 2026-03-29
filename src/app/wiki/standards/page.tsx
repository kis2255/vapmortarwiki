import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ExternalLink, ChevronRight } from "lucide-react";

/** 마크다운 기호를 제거하고 첫 의미 있는 문장 추출 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^##?\s+.*/gm, "")       // 헤더 제거
    .replace(/\|[^\n]+\|/g, "")        // 테이블 행 제거
    .replace(/[-|:]+\s*/g, "")         // 테이블 구분선 제거
    .replace(/\*\*/g, "")              // 볼드 제거
    .replace(/^[-*]\s+/gm, "")         // 리스트 마커 제거
    .replace(/\n+/g, " ")             // 줄바꿈 → 공백
    .replace(/\s{2,}/g, " ")          // 다중 공백 정리
    .trim();
}

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, { label: string; color: string }> = {
  KS: { label: "KS", color: "bg-blue-100 text-blue-800" },
  KDS: { label: "KDS", color: "bg-sky-100 text-sky-800" },
  EN: { label: "EN", color: "bg-emerald-100 text-emerald-800" },
  ASTM: { label: "ASTM", color: "bg-amber-100 text-amber-800" },
  ACI: { label: "ACI", color: "bg-violet-100 text-violet-800" },
  BS: { label: "BS", color: "bg-rose-100 text-rose-800" },
};

export default async function StandardsPage() {
  const standards = await prisma.standard.findMany({
    include: {
      products: {
        include: { product: { select: { id: true, name: true, code: true } } },
      },
    },
    orderBy: { code: "asc" },
  });

  // 카테고리별 그룹핑
  const grouped = standards.reduce<Record<string, typeof standards>>((acc, std) => {
    const cat = std.category || "기타";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(std);
    return acc;
  }, {});

  const categoryOrder = ["KS", "KDS", "EN", "ASTM", "ACI", "BS"];
  const sortedCategories = categoryOrder.filter((c) => grouped[c]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">규격/표준 목록</h1>
        <p className="text-sm text-[var(--color-muted)]">
          국내외 건설/콘크리트 보수 관련 규격 {standards.length}건
        </p>
      </div>

      {sortedCategories.map((cat) => {
        const catInfo = categoryLabels[cat] || { label: cat, color: "bg-gray-100 text-gray-800" };
        const items = grouped[cat];
        return (
          <div key={cat} className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${catInfo.color}`}>
                {catInfo.label}
              </span>
              <span className="text-xs text-[var(--color-muted)]">{items.length}건</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-sidebar)]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">규격번호</th>
                    <th className="px-4 py-2.5 text-left font-semibold">규격명</th>
                    <th className="px-4 py-2.5 text-left font-semibold">관련 제품</th>
                    <th className="w-10 px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((std) => (
                    <tr
                      key={std.id}
                      className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-sidebar)]/50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/wiki/standards/${std.id}`}
                          className="font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {std.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/wiki/standards/${std.id}`} className="hover:text-[var(--color-primary)]">
                          <div>{std.name}</div>
                          {std.description && (
                            <div className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted)]">
                              {stripMarkdown(std.description)}
                            </div>
                          )}
                        </Link>
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
                      <td className="px-2 py-3 text-[var(--color-muted)]">
                        <Link href={`/wiki/standards/${std.id}`}>
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { Package, FileText, Upload, MessageCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const marketHighlights = [
  { text: "2030년 국내 교량 51.3% 노후화 전망", icon: AlertTriangle },
  { text: "2026 SOC 예산 27.7조 (4년래 최대)", icon: TrendingUp },
  { text: "글로벌 특수몰탈 시장 CAGR 6.1% 성장", icon: TrendingUp },
];

export default async function HomePage() {
  const [productCount, articleCount, documentCount, recentArticles] =
    await Promise.all([
      prisma.product.count(),
      prisma.article.count({ where: { published: true } }),
      prisma.document.count(),
      prisma.article.findMany({
        where: { published: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { category: true },
      }),
    ]);

  const stats = [
    { label: "등록 제품", value: productCount.toString(), icon: Package, href: "/products" },
    { label: "위키 문서", value: articleCount.toString(), icon: FileText, href: "/wiki" },
    { label: "업로드 PDF", value: documentCount.toString(), icon: Upload, href: "/upload" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">VAP 특수몰탈 위키</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          기술자료 데이터베이스 및 AI 기반 질의응답 시스템
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-sidebar)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
              <stat.icon size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-[var(--color-muted)]">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* AI 질의응답 바로가기 */}
      <Link
        href="/chat"
        className="flex items-center gap-4 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-6 transition-colors hover:bg-[var(--color-primary)]/10"
      >
        <MessageCircle size={32} className="text-[var(--color-primary)]" />
        <div>
          <div className="text-lg font-semibold">AI 기술 질의응답</div>
          <div className="text-sm text-[var(--color-muted)]">
            제품 물성, 시공방법, KS 규격 등 무엇이든 질문하세요
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 최근 등록 문서 */}
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="mb-3 text-sm font-semibold">최근 등록 문서</h2>
          {recentArticles.length === 0 ? (
            <div className="text-sm text-[var(--color-muted)]">
              아직 등록된 문서가 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {recentArticles.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/wiki/${article.slug}`}
                    className="flex items-center justify-between text-sm hover:text-[var(--color-primary)]"
                  >
                    <span className="truncate">{article.title}</span>
                    {article.category && (
                      <span className="ml-2 shrink-0 rounded bg-[var(--color-sidebar)] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                        {article.category.name}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 시장 동향 요약 */}
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="mb-3 text-sm font-semibold">시장 동향 요약</h2>
          <ul className="space-y-2">
            {marketHighlights.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <item.icon size={14} className="shrink-0 text-[var(--color-primary)]" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

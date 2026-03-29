import Link from "next/link";
import { Package, FileText, Upload, MessageCircle, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const marketHighlights = [
  { text: "2030년 국내 교량 51.3% 노후화 전망", icon: AlertTriangle, color: "text-amber-500" },
  { text: "2026 SOC 예산 27.7조 (4년래 최대)", icon: TrendingUp, color: "text-emerald-500" },
  { text: "글로벌 특수몰탈 시장 CAGR 6.1% 성장", icon: TrendingUp, color: "text-blue-500" },
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
    { label: "등록 제품", value: productCount, icon: Package, href: "/products", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "위키 문서", value: articleCount, icon: FileText, href: "/wiki", color: "text-violet-600", bg: "bg-violet-50" },
    { label: "업로드 PDF", value: documentCount, icon: Upload, href: "/documents", color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 타이틀 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">VAP 특수몰탈 위키</h1>
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
            className="group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="text-[13px] text-[var(--color-muted)]">{stat.label}</div>
            </div>
            <ArrowRight size={16} className="ml-auto text-[var(--color-border)] transition-colors group-hover:text-[var(--color-primary)]" />
          </Link>
        ))}
      </div>

      {/* AI 질의응답 배너 */}
      <Link
        href="/chat"
        className="group flex items-center gap-5 rounded-xl bg-gradient-to-br from-[#1e40af] to-[#3b82f6] p-6 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <MessageCircle size={24} />
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold">AI 기술 질의응답</div>
          <div className="mt-0.5 text-sm text-blue-100">
            제품 물성, 시공방법, KS 규격 등 무엇이든 질문하세요
          </div>
        </div>
        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 최근 등록 문서 */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <h2 className="text-sm font-semibold">최근 등록 문서</h2>
            <Link href="/wiki" className="text-xs text-[var(--color-primary)] hover:underline">
              전체보기
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentArticles.length === 0 ? (
              <div className="p-5 text-center text-sm text-[var(--color-muted)]">
                등록된 문서가 없습니다.
              </div>
            ) : (
              recentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/wiki/${article.slug}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={14} className="shrink-0 text-[var(--color-muted)]" />
                    <span className="text-sm">{article.title}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
                    {formatDate(article.updatedAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 시장 동향 요약 */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <h2 className="text-sm font-semibold">시장 동향 요약</h2>
            <Link href="/wiki/domestic-market-trend" className="text-xs text-[var(--color-primary)] hover:underline">
              상세보기
            </Link>
          </div>
          <div className="space-y-1 p-5">
            {marketHighlights.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-hover)]">
                <item.icon size={16} className={`shrink-0 ${item.color}`} />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

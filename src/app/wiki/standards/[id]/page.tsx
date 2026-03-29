import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Package, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, { label: string; fullName: string; color: string }> = {
  KS: { label: "KS", fullName: "한국산업표준 (Korean Industrial Standards)", color: "bg-blue-100 text-blue-800" },
  KDS: { label: "KDS", fullName: "한국도로설계기준 (Korean Design Standard)", color: "bg-sky-100 text-sky-800" },
  EN: { label: "EN", fullName: "유럽표준 (European Standard)", color: "bg-emerald-100 text-emerald-800" },
  ASTM: { label: "ASTM", fullName: "미국재료시험협회 (American Society for Testing and Materials)", color: "bg-amber-100 text-amber-800" },
  ACI: { label: "ACI", fullName: "미국콘크리트학회 (American Concrete Institute)", color: "bg-violet-100 text-violet-800" },
  BS: { label: "BS", fullName: "영국표준 (British Standards)", color: "bg-rose-100 text-rose-800" },
};

export default async function StandardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const standard = await prisma.standard.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            select: { id: true, name: true, code: true, description: true },
            },
        },
      },
    },
  });

  if (!standard) notFound();

  // 관련 위키 문서 검색 (규격 코드 포함)
  const relatedArticles = await prisma.article.findMany({
    where: {
      OR: [
        { content: { contains: standard.code } },
        { title: { contains: standard.code } },
      ],
      published: true,
    },
    select: { id: true, title: true, slug: true },
    take: 5,
  });

  const catInfo = categoryLabels[standard.category || ""] || {
    label: standard.category || "-",
    fullName: "",
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* 뒤로 가기 */}
      <Link
        href="/wiki/standards"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]"
      >
        <ArrowLeft size={14} />
        규격/표준 목록
      </Link>

      {/* 헤더 */}
      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${catInfo.color}`}>
                {catInfo.label}
              </span>
              {catInfo.fullName && (
                <span className="text-xs text-[var(--color-muted)]">{catInfo.fullName}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{standard.code}</h1>
            <p className="mt-1 text-lg text-[var(--color-foreground)]">{standard.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 본문 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 설명 */}
          {standard.description && (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="mb-3 text-base font-bold">개요</h2>
              <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => <h3 className="mt-4 mb-2 text-sm font-bold">{children}</h3>,
                    h3: ({ children }) => <h4 className="mt-3 mb-1 text-sm font-semibold">{children}</h4>,
                    p: ({ children }) => <p className="mt-1.5 mb-1.5 text-sm leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="ml-4 mt-1 mb-1 list-disc space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="ml-4 mt-1 mb-1 list-decimal space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    table: ({ children }) => (
                      <div className="my-3 overflow-x-auto rounded-lg border border-[var(--color-border)]">
                        <table className="w-full text-xs border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-[var(--color-sidebar)]">{children}</thead>,
                    th: ({ children }) => <th className="border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-semibold">{children}</th>,
                    td: ({ children }) => <td className="border-b border-[var(--color-border)] px-3 py-2 text-xs">{children}</td>,
                  }}
                >
                  {standard.description}
                </ReactMarkdown>
              </div>
            </section>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* Infobox */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="mb-3 text-sm font-bold">규격 정보</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--color-muted)]">규격번호</dt>
                <dd className="font-medium text-[var(--color-primary)]">{standard.code}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">분류</dt>
                <dd>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${catInfo.color}`}>
                    {catInfo.label}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-muted)]">규격명</dt>
                <dd>{standard.name}</dd>
              </div>
            </dl>
          </div>

          {/* 관련 제품 */}
          {standard.products.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
                <Package size={14} />
                관련 제품
              </h3>
              <ul className="space-y-2">
                {standard.products.map((ps) => (
                  <li key={ps.product.id}>
                    <Link
                      href={`/products/${ps.product.id}`}
                      className="group block rounded-lg border border-[var(--color-border)] p-2.5 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                    >
                      <div className="flex items-center gap-1.5">
                        <ExternalLink size={11} className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)]" />
                        <span className="text-xs font-semibold text-[var(--color-primary)]">{ps.product.code}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--color-foreground)]">{ps.product.name}</div>
                      {ps.product.description && (
                        <div className="mt-0.5 line-clamp-2 text-[11px] text-[var(--color-muted)]">{ps.product.description}</div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 관련 위키 문서 */}
          {relatedArticles.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold">
                <FileText size={14} />
                관련 문서
              </h3>
              <ul className="space-y-1.5">
                {relatedArticles.map((art) => (
                  <li key={art.id}>
                    <Link
                      href={`/wiki/${art.slug}`}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-[var(--color-sidebar)]"
                    >
                      <FileText size={11} className="shrink-0 text-[var(--color-muted)]" />
                      <span className="text-[var(--color-foreground)]">{art.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

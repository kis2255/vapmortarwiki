import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft, Tag, Calendar, User, Edit3, History } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ArticleContent } from "@/components/wiki/article-content";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      products: { include: { product: true } },
    },
  });

  // 버전 이력 조회 (raw SQL - article_versions 테이블)
  let versions: { version: number; author: string | null; createdAt: Date }[] = [];
  if (article) {
    try {
      versions = await prisma.$queryRaw`
        SELECT version, author, "createdAt" FROM article_versions
        WHERE "articleId" = ${article.id} ORDER BY version DESC LIMIT 10
      `;
    } catch { /* 테이블 없으면 무시 */ }
  }

  if (!article) notFound();

  const parsedTags: string[] = article.tags || [];
  const headings = extractHeadings(article.content);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/wiki"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft size={14} /> 위키 문서
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* 메인 본문 (3/4) */}
        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <Link
              href={`/wiki/${article.slug}/edit`}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--color-sidebar)]"
            >
              <Edit3 size={14} /> 편집
            </Link>
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
            {article.author && (
              <span className="flex items-center gap-1">
                <User size={12} /> {article.author}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {formatDate(article.updatedAt)}
            </span>
            {article.category && (
              <span className="rounded bg-[var(--color-sidebar)] px-2 py-0.5">
                {article.category.name}
              </span>
            )}
          </div>

          <ArticleContent content={article.content} />

          {/* 태그 */}
          {parsedTags.length > 0 && (
            <div className="mt-8 flex items-center gap-2 border-t border-[var(--color-border)] pt-4">
              <Tag size={14} className="text-[var(--color-muted)]" />
              {parsedTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-sidebar)] px-2.5 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 관련 제품 */}
          {article.products.length > 0 && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <h3 className="mb-2 text-sm font-semibold">관련 제품</h3>
              <div className="flex flex-wrap gap-2">
                {article.products.map((ap) => (
                  <Link
                    key={ap.productId}
                    href={`/products/${ap.productId}`}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-sidebar)]"
                  >
                    {ap.product.name} ({ap.product.code})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 우측 사이드바: TOC (1/4) */}
        <div className="hidden space-y-4 lg:block">
          {headings.length > 0 && (
            <div className="sticky top-4 rounded-xl border border-[var(--color-border)] p-4">
              <h3 className="mb-2 text-xs font-semibold text-[var(--color-muted)]">
                목차
              </h3>
              <nav className="space-y-1">
                {headings.map((h, i) => (
                  <a
                    key={i}
                    href={`#${h.id}`}
                    className="block text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                    style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* 버전 이력 */}
          {versions.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] p-4">
              <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold text-[var(--color-muted)]">
                <History size={12} /> 편집 이력
              </h3>
              <div className="space-y-1.5">
                {versions.map((v) => (
                  <div key={v.version} className="text-[11px] text-[var(--color-muted)]">
                    <span className="font-medium">v{v.version}</span>
                    <span className="mx-1">·</span>
                    <span>{v.author || "시스템"}</span>
                    <span className="mx-1">·</span>
                    <span>{formatDate(v.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 현재 버전 */}
          <div className="rounded-xl border border-[var(--color-border)] p-4 text-[11px] text-[var(--color-muted)]">
            현재 버전: v{article.version}
          </div>
        </div>
      </div>
    </div>
  );
}

function extractHeadings(markdown: string) {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const text = match[2].trim();
      headings.push({
        level: match[1].length,
        text,
        id: text.toLowerCase().replace(/[^a-z0-9가-힣]/g, "-"),
      });
    }
  }
  return headings;
}

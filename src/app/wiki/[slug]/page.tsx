import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft, Tag, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

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

  if (!article) notFound();

  const parsedTags: string[] = article.tags ? JSON.parse(article.tags) : [];

  // 간단한 Markdown → HTML (제목, 볼드, 리스트, 테이블)
  const htmlContent = renderMarkdown(article.content);

  // 목차 생성
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
          <h1 className="mb-2 text-2xl font-bold">{article.title}</h1>
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

          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

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

        {/* 우측 사이드바: TOC + 요약 (1/4) */}
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

function renderMarkdown(markdown: string): string {
  let html = markdown
    // headings
    .replace(/^### (.+)$/gm, '<h3 id="$1" class="text-base font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 id="$1" class="text-lg font-semibold mt-8 mb-3 border-b border-[var(--color-border)] pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 id="$1" class="text-xl font-bold mt-8 mb-4">$1</h1>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>')
    // paragraphs
    .replace(/\n\n/g, "</p><p class='mt-2 text-sm leading-relaxed'>")
    // line breaks
    .replace(/\n/g, "<br/>");

  // wrap in paragraph
  html = `<p class='text-sm leading-relaxed'>${html}</p>`;

  // clean up heading IDs
  html = html.replace(/id="([^"]+)"/g, (_, id) =>
    `id="${id.toLowerCase().replace(/[^a-z0-9가-힣]/g, "-")}"`
  );

  return html;
}

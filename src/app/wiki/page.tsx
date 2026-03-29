import Link from "next/link";
import { Plus, FileText, Calendar, Tag } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WikiPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const articles = await prisma.article.findMany({
    where: {
      published: true,
      ...(category && { category: { slug: category } }),
    },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">위키 문서</h1>
          <p className="text-sm text-[var(--color-muted)]">
            특수몰탈 기술 문서 {articles.length}건
          </p>
        </div>
        <Link
          href="/wiki/new"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)]"
        >
          <Plus size={14} />
          문서 작성
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-muted)]">
          아직 작성된 위키 문서가 없습니다. 첫 번째 문서를 작성해 보세요.
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/wiki/${article.slug}`}
              className="block rounded-xl border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-sidebar)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="mt-0.5 text-[var(--color-primary)]" />
                  <h2 className="font-semibold">{article.title}</h2>
                </div>
                {article.category && (
                  <span className="rounded bg-[var(--color-sidebar)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
                    {article.category.name}
                  </span>
                )}
              </div>
              {article.excerpt && (
                <p className="mt-1 pl-6 text-sm text-[var(--color-muted)]">
                  {article.excerpt}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 pl-6">
                <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                  <Calendar size={10} />
                  {formatDate(article.updatedAt)}
                </span>
                {article.tags.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                    <Tag size={10} />
                    {article.tags.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

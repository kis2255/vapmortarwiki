import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { CheckCircle, XCircle, FileText, ExternalLink, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      properties: { orderBy: { name: "asc" } },
      standards: { include: { standard: true } },
      documents: { orderBy: { createdAt: "desc" } },
      articles: { include: { article: { select: { id: true, title: true, slug: true } } } },
    },
  });

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft size={14} />
        제품 목록
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 메인 콘텐츠 (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {product.description}
            </p>
          </div>

          {/* 물성 데이터 테이블 */}
          {product.properties.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)]">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3">
                <h2 className="text-sm font-semibold">물성 데이터</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-sidebar)]">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">시험항목</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">규격기준</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">시험결과</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">시험방법</th>
                      <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">판정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.properties.map((prop) => (
                      <tr
                        key={prop.id}
                        className="border-b border-[var(--color-border)] last:border-0"
                      >
                        <td className="px-4 py-3 text-[13px] font-medium">{prop.name}</td>
                        <td className="px-4 py-3 font-mono text-[13px] text-[var(--color-muted)]">
                          {prop.standard || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[14px] font-bold">{prop.value}</span>
                          <span className="ml-1 text-[11px] text-[var(--color-muted)]">{prop.unit}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-[var(--color-muted)]">
                          {prop.testMethod || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {prop.passed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-success)]">
                              <CheckCircle size={12} /> 합격
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-danger)]">
                              <XCircle size={12} /> 불합격
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 시공 방법 */}
          {product.method && (
            <div className="rounded-xl border border-[var(--color-border)]">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3">
                <h2 className="text-sm font-semibold">시공 방법</h2>
              </div>
              <div className="whitespace-pre-wrap p-4 text-sm leading-relaxed">
                {product.method}
              </div>
            </div>
          )}

          {/* 관련 위키 문서 */}
          {product.articles.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)]">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3">
                <h2 className="text-sm font-semibold">관련 위키 문서</h2>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {product.articles.map((ap) => (
                  <Link
                    key={ap.article.id}
                    href={`/wiki/${ap.article.slug}`}
                    className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
                  >
                    <FileText size={14} className="text-[var(--color-primary)]" />
                    {ap.article.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 관련 PDF 문서 */}
          {product.documents.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)]">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3">
                <h2 className="text-sm font-semibold">관련 문서</h2>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {product.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[var(--color-muted)]" />
                      <span className="text-sm">{doc.fileName}</span>
                      <span className="rounded bg-[var(--color-sidebar)] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                        {doc.documentType}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Infobox 사이드바 (1/3) */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)]">
            <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-4 py-3">
              <h2 className="text-sm font-semibold text-white">제품 정보</h2>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <InfoRow label="제품코드" value={product.code} />
              <InfoRow label="카테고리" value={product.category.name} />
              {product.usage && <InfoRow label="용도" value={product.usage} />}
              {product.packaging && <InfoRow label="포장" value={product.packaging} />}
              {product.mixRatio && <InfoRow label="배합비" value={product.mixRatio} />}
              {product.curing && <InfoRow label="양생" value={product.curing} />}
            </div>
          </div>

          {/* 관련 규격 */}
          {product.standards.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)]">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3">
                <h2 className="text-sm font-semibold">관련 규격</h2>
              </div>
              <div className="p-4">
                {product.standards.map((ps) => (
                  <div key={ps.standardId} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]">
                      <ExternalLink size={12} />
                      {ps.standard.code}
                    </div>
                    <p className="text-xs text-[var(--color-muted)]">
                      {ps.standard.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 적용범위 */}
          {product.scope && (
            <div className="rounded-xl border border-[var(--color-border)]">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3">
                <h2 className="text-sm font-semibold">적용범위</h2>
              </div>
              <p className="p-4 text-sm leading-relaxed">{product.scope}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

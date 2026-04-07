import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft, Download, FileText, Database, Hash } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, { label: string; color: string }> = {
  TDS: { label: "TDS (기술자료)", color: "bg-blue-100 text-blue-800" },
  MSDS: { label: "MSDS (안전보건)", color: "bg-red-100 text-red-800" },
  TEST_REPORT: { label: "시험성적서", color: "bg-green-100 text-green-800" },
  CERTIFICATE: { label: "인증서", color: "bg-purple-100 text-purple-800" },
  CASE_STUDY: { label: "시공사례", color: "bg-amber-100 text-amber-800" },
  CATALOG: { label: "카탈로그", color: "bg-cyan-100 text-cyan-800" },
  TECHNICAL_PAPER: { label: "기술논문/가이드", color: "bg-indigo-100 text-indigo-800" },
  OTHER: { label: "기타", color: "bg-gray-100 text-gray-700" },
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { product: { select: { name: true, code: true, id: true } } },
  });
  if (!doc) notFound();

  // vector는 Unsupported 타입이므로 raw SQL로 존재 여부만 확인
  const chunksRaw = await prisma.$queryRaw<
    { id: string; content: string; has_vector: boolean }[]
  >`SELECT id, content, (vector IS NOT NULL) as has_vector FROM embeddings WHERE "documentId" = ${id} ORDER BY id ASC`;
  const chunks = chunksRaw;

  const t = typeLabels[doc.documentType] || typeLabels.OTHER;
  const vectorCount = chunks.filter((c) => c.has_vector).length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/documents"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft size={14} /> PDF 문서 목록
      </Link>

      {/* 문서 정보 헤더 */}
      <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between border-b border-[var(--color-border)] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <FileText size={24} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{doc.fileName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${t.color}`}>
                  {t.label}
                </span>
                <span className="text-[var(--color-muted)]">{doc.pageCount || 0}페이지</span>
                <span className="text-[var(--color-muted)]">{(doc.fileSize / 1024).toFixed(0)}KB</span>
                <span className="text-[var(--color-muted)]">{formatDate(doc.createdAt)}</span>
              </div>
            </div>
          </div>
          {doc.fileName && (
            <a
              href={`/uploads/pdfs/${encodeURIComponent(doc.fileName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
            >
              <Download size={14} /> 다운로드
            </a>
          )}
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 divide-x divide-[var(--color-border)] bg-[var(--color-sidebar)]">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold">{chunks.length}</div>
            <div className="text-[11px] text-[var(--color-muted)]">청크 수</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-success)]">{vectorCount}</div>
            <div className="text-[11px] text-[var(--color-muted)]">벡터 임베딩</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold">{doc.extractedText?.length?.toLocaleString() || 0}</div>
            <div className="text-[11px] text-[var(--color-muted)]">추출 문자수</div>
          </div>
        </div>

        {doc.product && (
          <div className="border-t border-[var(--color-border)] px-5 py-3 text-[13px]">
            연결 제품: <Link href={`/products/${doc.product.id}`} className="font-medium text-[var(--color-primary)] hover:underline">{doc.product.name} ({doc.product.code})</Link>
          </div>
        )}
      </div>

      {/* 인덱싱된 청크 목록 */}
      <div className="mb-4 flex items-center gap-2">
        <Database size={16} className="text-[var(--color-primary)]" />
        <h2 className="text-sm font-semibold">인덱싱된 청크 ({chunks.length}건)</h2>
        <span className="text-[11px] text-[var(--color-muted)]">AI 채팅 검색에 사용되는 텍스트 조각</span>
      </div>

      <div className="space-y-2">
        {chunks.map((chunk, idx) => (
          <details
            key={chunk.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
          >
            <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 text-[13px] hover:bg-[var(--color-surface-hover)]">
              <Hash size={12} className="shrink-0 text-[var(--color-muted)]" />
              <span className="font-mono text-[11px] text-[var(--color-muted)]">#{idx + 1}</span>
              <span className="flex-1 truncate">{chunk.content.slice(0, 120)}</span>
              {chunk.has_vector ? (
                <span className="shrink-0 rounded-full bg-[var(--color-success-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success)]">벡터</span>
              ) : (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">텍스트만</span>
              )}
            </summary>
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-foreground)]">
                {chunk.content}
              </pre>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

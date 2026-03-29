import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { FileText, Download, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, { label: string; color: string }> = {
  TDS: { label: "TDS", color: "bg-blue-100 text-blue-800" },
  MSDS: { label: "MSDS", color: "bg-red-100 text-red-800" },
  TEST_REPORT: { label: "시험성적서", color: "bg-green-100 text-green-800" },
  CERTIFICATE: { label: "인증서", color: "bg-purple-100 text-purple-800" },
  CASE_STUDY: { label: "시공사례", color: "bg-amber-100 text-amber-800" },
  CATALOG: { label: "카탈로그", color: "bg-cyan-100 text-cyan-800" },
  TECHNICAL_PAPER: { label: "기술논문", color: "bg-indigo-100 text-indigo-800" },
  OTHER: { label: "기타", color: "bg-gray-100 text-gray-700" },
};

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    include: { product: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });

  const embeddingCounts = await prisma.embedding.groupBy({
    by: ["documentId"],
    _count: true,
    where: { documentId: { not: null } },
  });
  const chunkMap = new Map(embeddingCounts.map((e) => [e.documentId, e._count]));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">PDF 문서 관리</h1>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
          업로드된 PDF {documents.length}건 | 텍스트 추출 및 AI 검색에 반영됨
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b-2 border-[var(--color-border)] bg-[var(--color-sidebar)]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">파일명</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">분류</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">페이지</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">임베딩</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">연결 제품</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">업로드일</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[var(--color-muted)]">
                  업로드된 PDF가 없습니다.
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const t = typeLabels[doc.documentType] || typeLabels.OTHER;
                const chunks = chunkMap.get(doc.id) || 0;
                return (
                  <tr key={doc.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="shrink-0 text-red-500" />
                        <Link href={`/documents/${doc.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                          {doc.fileName}
                        </Link>
                      </div>
                      {doc.extractedText && (
                        <p className="mt-0.5 pl-6 text-[11px] text-[var(--color-muted)] line-clamp-1">
                          {doc.extractedText.slice(0, 120)}...
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.color}`}>
                        {t.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{doc.pageCount || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={chunks > 0 ? "font-mono font-semibold text-[var(--color-success)]" : "text-[var(--color-muted)]"}>
                        {chunks > 0 ? `${chunks}건` : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {doc.product ? `${doc.product.code}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {doc.filePath && (
                          <a href={`/${doc.filePath}`} download title="다운로드" className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-sidebar)] hover:text-[var(--color-foreground)]">
                            <Download size={14} />
                          </a>
                        )}
                        <Link href={`/documents/${doc.id}`} title="상세 보기" className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-sidebar)] hover:text-[var(--color-primary)]">
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-sidebar)] p-4 text-[13px]">
        <p className="font-semibold">PDF 반영 과정</p>
        <p className="mt-1 text-[var(--color-muted)]">
          업로드 → 텍스트 추출 → AI 자동분류 → 청킹 → Gemini 임베딩(768차원) → pgvector 저장 → AI 채팅에서 검색 가능
        </p>
      </div>
    </div>
  );
}

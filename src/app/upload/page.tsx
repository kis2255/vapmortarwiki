"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "classifying" | "done" | "error";
  autoType?: string;
  confirmedType?: string;
  linkedProduct?: string;
}

const documentTypes = [
  { value: "TDS", label: "TDS (기술자료)" },
  { value: "MSDS", label: "MSDS (안전보건자료)" },
  { value: "TEST_REPORT", label: "시험성적서" },
  { value: "CERTIFICATE", label: "인증서" },
  { value: "CASE_STUDY", label: "시공사례" },
  { value: "CATALOG", label: "카탈로그" },
  { value: "TECHNICAL_PAPER", label: "기술논문" },
  { value: "OTHER", label: "기타" },
];

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList)
      .filter((f) => f.type === "application/pdf")
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: f.size,
        status: "classifying" as const,
        autoType: undefined,
      }));

    setFiles((prev) => [...prev, ...newFiles]);

    // 실제 API 업로드 + 자동 분류
    for (const fileInfo of newFiles) {
      const actualFile = Array.from(fileList).find((f) => f.name === fileInfo.name);
      if (!actualFile) continue;

      const formData = new FormData();
      formData.append("file", actualFile);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileInfo.id
                ? {
                    ...f,
                    status: "done" as const,
                    autoType: data.classification?.type || "OTHER",
                    confirmedType: data.documentType,
                  }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileInfo.id ? { ...f, status: "error" as const } : f
            )
          );
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileInfo.id ? { ...f, status: "error" as const } : f
          )
        );
      }
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">PDF 자료 업로드</h1>
        <p className="text-sm text-[var(--color-muted)]">
          PDF를 업로드하면 AI가 자동으로 문서 유형을 분류합니다
        </p>
      </div>

      {/* 드래그앤드롭 영역 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
            : "border-[var(--color-border)]"
        )}
      >
        <Upload size={40} className="mb-3 text-[var(--color-muted)]" />
        <p className="mb-1 text-sm font-medium">PDF 파일을 드래그하거나 클릭하여 선택</p>
        <p className="text-xs text-[var(--color-muted)]">여러 파일 동시 업로드 가능</p>
        <label className="mt-4 cursor-pointer rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)]">
          파일 선택
          <input
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
            }}
          />
        </label>
      </div>

      {/* 업로드 목록 */}
      {files.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">업로드 대기열 ({files.length}건)</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-sidebar)]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">파일명</th>
                  <th className="w-32 px-4 py-2 text-left font-semibold">AI 분류</th>
                  <th className="w-40 px-4 py-2 text-left font-semibold">확정 분류</th>
                  <th className="w-36 px-4 py-2 text-left font-semibold">제품 연결</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[var(--color-muted)]" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {file.status === "classifying" ? (
                        <span className="flex items-center gap-1 text-[var(--color-muted)]">
                          <Loader2 size={12} className="animate-spin" /> 분류 중
                        </span>
                      ) : file.autoType === "OTHER" ? (
                        <span className="flex items-center gap-1 text-amber-500">
                          <AlertCircle size={12} /> 미확인
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[var(--color-success)]">
                          <CheckCircle size={12} /> {file.autoType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={file.confirmedType || ""}
                        onChange={(e) => {
                          setFiles((prev) =>
                            prev.map((f) =>
                              f.id === file.id ? { ...f, confirmedType: e.target.value } : f
                            )
                          );
                        }}
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs"
                      >
                        <option value="">선택</option>
                        {documentTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs">
                        <option value="">제품 선택</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)]">
              업로드 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

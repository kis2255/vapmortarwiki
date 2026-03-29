"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Edit3 } from "lucide-react";
import Link from "next/link";

export default function NewArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [content, setContent] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      title: formData.get("title"),
      content,
      tags: (formData.get("tags") as string)
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      categorySlug: formData.get("category") || null,
    };

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/wiki/${data.slug}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/wiki"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft size={14} /> 위키 문서
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">새 위키 문서 작성</h1>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm"
        >
          {preview ? <Edit3 size={14} /> : <Eye size={14} />}
          {preview ? "편집" : "미리보기"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <input
              name="title"
              required
              placeholder="문서 제목"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3 text-lg font-semibold outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <select
            name="category"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-3 text-sm"
          >
            <option value="">카테고리 선택</option>
            <option value="repair-mortar">보수몰탈</option>
            <option value="waterproof-mortar">방수몰탈</option>
            <option value="floor-mortar">바닥몰탈</option>
            <option value="injection">주입재</option>
            <option value="grout">그라우트</option>
          </select>
        </div>

        <input
          name="tags"
          placeholder="태그 (쉼표로 구분: PCM, 단면보수, KS F 4042)"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
        />

        {preview ? (
          <div className="min-h-[400px] rounded-xl border border-[var(--color-border)] p-6">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {content || "내용을 입력하세요..."}
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Markdown으로 작성하세요...

# 제목
## 소제목

일반 텍스트를 입력합니다.

| 항목 | 값 |
|------|-----|
| 압축강도 | 52.3 MPa |"
            rows={20}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3 font-mono text-sm outline-none focus:border-[var(--color-primary)]"
          />
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/wiki"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {saving ? "저장 중..." : "문서 발행"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MarkdownEditor } from "@/components/wiki/markdown-editor";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  useEffect(() => {
    fetch(`/api/articles/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
        setCategorySlug(data.category?.slug || "");
        setLoading(false);
      });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), categorySlug }),
      });
      if (res.ok) router.push(`/wiki/${slug}`);
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-center text-[var(--color-muted)]">로딩 중...</div>;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/wiki/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
        <ArrowLeft size={14} /> 문서로 돌아가기
      </Link>
      <h1 className="mb-6 text-xl font-bold tracking-tight">문서 편집</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-3 text-lg font-semibold outline-none focus:border-[var(--color-primary)]" />
          </div>
          <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-3 py-3 text-sm">
            <option value="">카테고리 선택</option>
            <option value="repair-mortar">보수몰탈</option>
            <option value="waterproof-mortar">방수몰탈</option>
            <option value="floor-mortar">바닥몰탈</option>
            <option value="injection">주입재</option>
            <option value="grout">그라우트</option>
            <option value="market-analysis">시장/경쟁사</option>
            <option value="international-standards">국제규격</option>
          </select>
        </div>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="태그 (쉼표로 구분)" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] px-4 py-2 text-sm outline-none focus:border-[var(--color-primary)]" />
        <MarkdownEditor value={content} onChange={setContent} />
        <div className="flex justify-end gap-3">
          <Link href={`/wiki/${slug}`} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">취소</Link>
          <button type="submit" disabled={saving} className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

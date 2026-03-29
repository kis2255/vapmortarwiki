"use client";

import { useSearchParams } from "next/navigation";
import { Search, Package, FileText, Upload, BookOpen, Loader2 } from "lucide-react";
import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  excerpt: string;
  meta?: Record<string, string>;
}

const filterTabs = [
  { label: "전체", value: "all", icon: Search },
  { label: "제품", value: "products", icon: Package },
  { label: "위키문서", value: "articles", icon: FileText },
  { label: "PDF문서", value: "documents", icon: Upload },
  { label: "규격", value: "standards", icon: BookOpen },
];

const typeIcons: Record<string, typeof Package> = {
  product: Package,
  article: FileText,
  document: Upload,
  standard: BookOpen,
};

const typeLabels: Record<string, string> = {
  product: "제품",
  article: "문서",
  document: "PDF",
  standard: "규격",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string, type: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery, activeTab);
  }, [initialQuery, activeTab, doSearch]);

  function getLink(r: SearchResult) {
    if (r.type === "product") return `/products/${r.id}`;
    if (r.type === "article") return `/wiki/${r.id}`;
    if (r.type === "standard") return `/wiki/standards`;
    return "#";
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">통합 검색</h1>
      </div>

      {/* 검색바 */}
      <form
        onSubmit={(e) => { e.preventDefault(); doSearch(query, activeTab); }}
        className="relative mb-4"
      >
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제품명, 물성, 규격번호 등 검색..."
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-sidebar)] py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)]"
        />
      </form>

      {/* 필터 탭 */}
      <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); if (query) doSearch(query, tab.value); }}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
              activeTab === tab.value
                ? "border-[var(--color-primary)] text-[var(--color-primary)] font-medium"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
            {searched && activeTab === tab.value && !loading && (
              <span className="ml-1 rounded-full bg-[var(--color-sidebar)] px-1.5 text-[11px]">
                {results.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 결과 */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--color-muted)]">
          <Loader2 size={20} className="mr-2 animate-spin" /> 검색 중...
        </div>
      ) : !searched ? (
        <div className="rounded-xl border border-[var(--color-border)] p-16 text-center text-sm text-[var(--color-muted)]">
          검색어를 입력하고 Enter를 누르세요.
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] p-16 text-center text-sm text-[var(--color-muted)]">
          &quot;{query}&quot;에 대한 검색 결과가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const Icon = typeIcons[r.type] || FileText;
            return (
              <Link
                key={`${r.type}-${r.id}`}
                href={getLink(r)}
                className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-sidebar)]">
                    <Icon size={14} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.title}</span>
                      <span className="rounded-full bg-[var(--color-sidebar)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
                        {typeLabels[r.type] || r.type}
                      </span>
                    </div>
                    {r.excerpt && (
                      <p className="mt-1 text-[13px] text-[var(--color-muted)] line-clamp-2">{r.excerpt}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}

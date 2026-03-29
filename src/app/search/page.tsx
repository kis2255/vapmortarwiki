"use client";

import { useSearchParams } from "next/navigation";
import { Search, Package, FileText, Upload, BookOpen } from "lucide-react";
import { Suspense } from "react";

const filterTabs = [
  { label: "전체", value: "all", icon: Search },
  { label: "제품", value: "products", icon: Package },
  { label: "위키문서", value: "articles", icon: FileText },
  { label: "PDF문서", value: "documents", icon: Upload },
  { label: "규격", value: "standards", icon: BookOpen },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">통합 검색</h1>
        {query && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            &quot;{query}&quot; 검색 결과
          </p>
        )}
      </div>

      {/* 검색바 */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          type="text"
          defaultValue={query}
          placeholder="제품명, 물성, 규격번호 등 검색..."
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-sidebar)] py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* 필터 탭 */}
      <div className="mb-6 flex gap-1 border-b border-[var(--color-border)]">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            className="flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] data-[active=true]:border-[var(--color-primary)] data-[active=true]:text-[var(--color-primary)]"
            data-active={tab.value === "all"}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 결과 */}
      <div className="rounded-xl border border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-muted)]">
        {query ? "검색 결과가 없습니다." : "검색어를 입력해 주세요."}
      </div>
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

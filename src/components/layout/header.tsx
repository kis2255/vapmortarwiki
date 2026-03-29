"use client";

import Link from "next/link";
import { Search, Upload, MessageCircle, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="flex h-14 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4">
      {/* 모바일 메뉴 */}
      <button className="md:hidden">
        <Menu size={20} />
      </button>

      {/* 검색바 */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <input
            type="text"
            placeholder="제품, 문서, 규격 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
              }
            }}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="flex items-center gap-2">
        <Link
          href="/chat"
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm text-white hover:bg-[var(--color-primary-hover)]"
        >
          <MessageCircle size={14} />
          <span className="hidden sm:inline">AI 질의</span>
        </Link>
        <Link
          href="/upload"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-sidebar)]"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">업로드</span>
        </Link>
      </div>
    </header>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Menu, MessageCircle, Upload, Search, Sun, Moon, Monitor, Minus, Plus } from "lucide-react";
import Link from "next/link";

type Theme = "light" | "dark" | "system";
type FontSize = "sm" | "base" | "lg";

const fontSizeMap: Record<FontSize, { label: string; value: string; body: string }> = {
  sm: { label: "작게", value: "13px", body: "text-[13px]" },
  base: { label: "보통", value: "14px", body: "text-[14px]" },
  lg: { label: "크게", value: "16px", body: "text-[16px]" },
};

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<Theme>("system");
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 초기 로드: localStorage에서 설정 복원
  useEffect(() => {
    const savedTheme = localStorage.getItem("vap-theme") as Theme | null;
    const savedFont = localStorage.getItem("vap-fontsize") as FontSize | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedFont) setFontSize(savedFont);
  }, []);

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem("vap-theme", theme);

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // system
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  // 폰트 크기 적용
  useEffect(() => {
    document.documentElement.style.fontSize = fontSizeMap[fontSize].value;
    localStorage.setItem("vap-fontsize", fontSize);
  }, [fontSize]);

  function cycleFontSize(dir: 1 | -1) {
    const sizes: FontSize[] = ["sm", "base", "lg"];
    const idx = sizes.indexOf(fontSize);
    const next = idx + dir;
    if (next >= 0 && next < sizes.length) setFontSize(sizes[next]);
  }

  return (
    <div className="flex h-screen">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 px-4 backdrop-blur-md sm:px-5">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          {/* 검색바 */}
          <div className="flex flex-1 items-center">
            <div className="relative w-full max-w-md transition-all duration-200 focus-within:max-w-lg">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
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
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-sidebar)] py-2 pl-9 pr-12 text-[13px] outline-none transition-all focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:shadow-[0_0_0_3px_rgba(30,64,175,0.08)]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted)] sm:inline">
                Ctrl+K
              </span>
            </div>
          </div>

          {/* 설정 + 액션 */}
          <div className="flex items-center gap-2">
            {/* 폰트 크기 조절 */}
            <div className="hidden items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] sm:flex">
              <button
                onClick={() => cycleFontSize(-1)}
                disabled={fontSize === "sm"}
                className="px-2 py-1.5 text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] disabled:opacity-30"
                title="글자 작게"
              >
                <Minus size={14} />
              </button>
              <span className="border-x border-[var(--color-border)] px-2 py-1.5 text-[11px] font-medium text-[var(--color-muted)]">
                {fontSizeMap[fontSize].label}
              </span>
              <button
                onClick={() => cycleFontSize(1)}
                disabled={fontSize === "lg"}
                className="px-2 py-1.5 text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] disabled:opacity-30"
                title="글자 크게"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* 테마 토글 */}
            <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                onClick={() => setTheme("light")}
                className={`rounded-l-lg px-2 py-1.5 transition-colors ${theme === "light" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"}`}
                title="라이트 모드"
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`border-x border-[var(--color-border)] px-2 py-1.5 transition-colors ${theme === "system" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"}`}
                title="시스템 설정"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`rounded-r-lg px-2 py-1.5 transition-colors ${theme === "dark" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"}`}
                title="다크 모드"
              >
                <Moon size={14} />
              </button>
            </div>

            <Link href="/chat" className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]">
              <MessageCircle size={14} />
              <span className="hidden sm:inline">AI 질의</span>
            </Link>
            <Link href="/upload" className="hidden items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-medium shadow-sm transition-colors hover:bg-[var(--color-sidebar)] sm:flex">
              <Upload size={14} />
              업로드
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

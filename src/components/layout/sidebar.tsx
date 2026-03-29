"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Package, FileText, Upload, MessageCircle,
  Search, BookOpen, ChevronDown, ChevronRight, X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryDot } from "@/components/ui/category-badge";

const navigation = [
  { name: "대시보드", href: "/", icon: Home },
  { name: "제품 DB", href: "/products", icon: Package },
  { name: "위키 문서", href: "/wiki", icon: FileText },
  { name: "PDF 문서", href: "/documents", icon: Upload },
  { name: "AI 질의응답", href: "/chat", icon: MessageCircle },
  { name: "통합 검색", href: "/search", icon: Search },
  { name: "KS 규격", href: "/wiki/standards", icon: BookOpen },
];

const categories = [
  { name: "보수몰탈", slug: "repair-mortar", href: "/products?category=repair-mortar" },
  { name: "방수몰탈", slug: "waterproof-mortar", href: "/products?category=waterproof-mortar" },
  { name: "바닥몰탈", slug: "floor-mortar", href: "/products?category=floor-mortar" },
  { name: "주입재", slug: "injection", href: "/products?category=injection" },
  { name: "그라우트", slug: "grout", href: "/products?category=grout" },
  { name: "시장/경쟁사", slug: "market-analysis", href: "/wiki?category=market-analysis" },
  { name: "국제규격", slug: "international-standards", href: "/wiki?category=international-standards" },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [categoryOpen, setCategoryOpen] = useState(true);

  return (
    <>
      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] transition-transform md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* 로고 */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white shadow-sm">V</div>
              <div>
                <div className="text-sm font-bold leading-tight">VAP 특수몰탈</div>
                <div className="text-[11px] text-[var(--color-muted)]">기술 위키</div>
              </div>
            </Link>
            <button className="rounded-md p-1 text-[var(--color-muted)] md:hidden" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                        isActive
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
                      )}
                    >
                      <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6">
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
              >
                {categoryOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                카테고리
              </button>
              {categoryOpen && (
                <ul className="mt-1 space-y-0.5">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={cat.href}
                        onClick={onClose}
                        className="flex items-center gap-2.5 rounded-lg px-5 py-1.5 text-[13px] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)]"
                      >
                        <CategoryDot slug={cat.slug} />
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

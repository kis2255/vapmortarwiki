"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  FileText,
  Upload,
  MessageCircle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryDot } from "@/components/ui/category-badge";

const navigation = [
  { name: "대시보드", href: "/", icon: Home },
  { name: "제품 DB", href: "/products", icon: Package },
  { name: "위키 문서", href: "/wiki", icon: FileText },
  { name: "PDF 관리", href: "/upload", icon: Upload },
  { name: "AI 질의응답", href: "/chat", icon: MessageCircle },
  { name: "통합 검색", href: "/search", icon: Search },
  { name: "KS 규격", href: "/wiki/standards", icon: BookOpen },
];

const categories = [
  { name: "보수몰탈", slug: "repair-mortar" },
  { name: "방수몰탈", slug: "waterproof-mortar" },
  { name: "바닥몰탈", slug: "floor-mortar" },
  { name: "주입재", slug: "injection" },
  { name: "그라우트", slug: "grout" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [categoryOpen, setCategoryOpen] = useState(true);

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] md:flex md:flex-col">
      {/* 로고 */}
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white shadow-sm">
            V
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">VAP 특수몰탈</div>
            <div className="text-[11px] text-[var(--color-muted)]">기술 위키</div>
          </div>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
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

        {/* 카테고리 트리 */}
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
                    href={`/products?category=${cat.slug}`}
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
    </aside>
  );
}

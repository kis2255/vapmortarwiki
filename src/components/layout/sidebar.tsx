"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Package, FileText, Upload, MessageCircle,
  Search, BookOpen, ChevronDown, ChevronRight, X,
  PanelLeftClose, PanelLeftOpen, LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryDot } from "@/components/ui/category-badge";

const navigation = [
  { name: "프로젝트 현황", href: "/dashboard", icon: LayoutDashboard },
  { name: "대시보드", href: "/", icon: Home },
  { name: "제품 DB", href: "/products", icon: Package },
  { name: "위키 문서", href: "/wiki", icon: FileText },
  { name: "PDF 문서", href: "/documents", icon: Upload },
  { name: "AI 질의응답", href: "/chat", icon: MessageCircle },
  { name: "통합 검색", href: "/search", icon: Search },
  { name: "규격/표준", href: "/wiki/standards", icon: BookOpen },
];

const categoryGroups = [
  {
    name: "제품",
    slug: "products",
    children: [
      { name: "그라우트", slug: "grout", href: "/products?category=grout" },
      { name: "보수몰탈", slug: "repair-mortar", href: "/products?category=repair-mortar" },
      { name: "바닥몰탈", slug: "floor-mortar", href: "/products?category=floor-mortar" },
      { name: "타일용", slug: "tile", href: "/products?category=tile" },
    ],
  },
  {
    name: "시장/경쟁사",
    slug: "market-analysis",
    href: "/wiki?category=market-analysis",
  },
  {
    name: "국제규격",
    slug: "international-standards",
    href: "/wiki?category=international-standards",
  },
];

export function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }: {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [productOpen, setProductOpen] = useState(true);

  return (
    <>
      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] transition-all duration-200 md:relative md:translate-x-0",
          collapsed ? "w-[60px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* 로고 */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-4">
            {collapsed ? (
              <Link href="/" className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[0.875rem] font-bold text-white shadow-sm" onClick={onClose}>
                S
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2.5 px-2" onClick={onClose}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[0.875rem] font-bold text-white shadow-sm">S</div>
                <div>
                  <div className="text-[0.9375rem] font-bold leading-tight">SAMPYO 특수몰탈</div>
                  <div className="text-[0.75rem] font-medium text-[var(--color-muted)]">WIKI</div>
                </div>
              </Link>
            )}
            <button className="rounded-md p-1 text-[var(--color-muted)] md:hidden" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && !navigation.some((other) => other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-lg py-2 text-[0.8125rem] font-medium transition-all",
                        collapsed ? "justify-center px-2" : "gap-2.5 px-3",
                        isActive
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]"
                      )}
                    >
                      <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                      {!collapsed && item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {!collapsed && <div className="mt-6">
              <button
                onClick={() => setCategoryOpen(!categoryOpen)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
              >
                {categoryOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                카테고리
              </button>
              {categoryOpen && (
                <ul className="mt-1 space-y-0.5">
                  {categoryGroups.map((group) =>
                    "children" in group && group.children ? (
                      <li key={group.slug}>
                        <button
                          onClick={() => setProductOpen(!productOpen)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-5 py-1.5 text-[0.8125rem] font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)]"
                        >
                          {productOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          <CategoryDot slug="repair-mortar" />
                          {group.name}
                        </button>
                        {productOpen && (
                          <ul className="mt-0.5 space-y-0.5">
                            {group.children.map((cat) => (
                              <li key={cat.slug}>
                                <Link
                                  href={cat.href}
                                  onClick={onClose}
                                  className="flex items-center gap-2.5 rounded-lg py-1.5 pl-10 pr-3 text-[0.8125rem] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)]"
                                >
                                  <CategoryDot slug={cat.slug} />
                                  {cat.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ) : (
                      <li key={group.slug}>
                        <Link
                          href={group.href!}
                          onClick={onClose}
                          className="flex items-center gap-2.5 rounded-lg px-5 py-1.5 text-[0.8125rem] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)]"
                        >
                          <CategoryDot slug={group.slug} />
                          {group.name}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>}
          </nav>

          {/* 접기/펼치기 토글 */}
          <div className="hidden border-t border-[var(--color-border)] p-2 md:block">
            <button
              onClick={onToggleCollapse}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[0.75rem] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
              title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> 메뉴 접기</>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/layout/layout-shell";

export const metadata: Metadata = {
  title: "VAP 특수몰탈 위키",
  description: "특수몰탈 기술자료 데이터베이스 및 위키",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--color-background)]">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

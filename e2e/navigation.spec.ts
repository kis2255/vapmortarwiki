import { test, expect } from "@playwright/test";

test.describe("페이지 네비게이션", () => {
  test("대시보드 로딩", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("제품 목록 로딩 + 제품 표시", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("link", { name: "SG 45N" }).first()).toBeVisible({ timeout: 15000 });
  });

  test("위키 목록 로딩", async ({ page }) => {
    await page.goto("/wiki");
    await expect(page.getByRole("heading", { name: "위키 문서" })).toBeVisible({ timeout: 15000 });
  });

  test("규격/표준 목록 로딩 + 카테고리 그룹핑", async ({ page }) => {
    await page.goto("/wiki/standards");
    await expect(page.getByRole("heading", { name: "규격/표준 목록" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: "KS F 4042" }).first()).toBeVisible();
  });

  test("AI 채팅 페이지 로딩", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.locator("text=AI 기술 질의응답")).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[placeholder="질문을 입력하세요..."]')).toBeVisible();
  });

  test("통합 검색 페이지 로딩", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: "통합 검색" })).toBeVisible({ timeout: 15000 });
  });

  test("사이드바 메뉴 표시", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "제품 DB" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AI 질의응답" })).toBeVisible();
    await expect(page.getByRole("link", { name: "규격/표준" })).toBeVisible();
  });
});

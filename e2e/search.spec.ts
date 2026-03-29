import { test, expect } from "@playwright/test";

test.describe("통합 검색", () => {
  test("검색어 입력 → 결과 표시", async ({ page }) => {
    await page.goto("/search");
    await page.waitForTimeout(2000);
    // 검색 페이지의 메인 검색 입력창
    const searchInput = page.locator("input[placeholder*='검색']").or(page.locator("input[type='text']")).first();
    await searchInput.fill("그라우트");
    await searchInput.press("Enter");
    await page.waitForTimeout(5000);
    // 검색 결과 영역에 내용이 있어야 함 (결과 카드 또는 탭 건수)
    const hasResults = await page.locator("text=전체").first().isVisible();
    expect(hasResults).toBe(true);
  });

  test("헤더 검색창 동작", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    const headerSearch = page.locator("header input, nav input").first();
    if (await headerSearch.isVisible()) {
      await headerSearch.fill("보수몰탈");
      await headerSearch.press("Enter");
      await page.waitForTimeout(3000);
      expect(page.url()).toContain("/search");
    }
  });
});

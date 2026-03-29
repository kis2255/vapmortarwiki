import { test, expect } from "@playwright/test";

test.describe("제품 DB", () => {
  test("제품 목록에서 카테고리 배지 표시", async ({ page }) => {
    await page.goto("/products");
    await page.waitForTimeout(3000);
    // 그라우트 또는 보수몰탈 카테고리 배지가 보여야 함
    await expect(page.locator("text=그라우트").or(page.locator("text=보수몰탈")).first()).toBeVisible();
  });

  test("제품 클릭 → 상세 페이지 이동", async ({ page }) => {
    await page.goto("/products");
    await page.waitForTimeout(3000);
    const productLink = page.locator("a:has-text('SG 45N'), a:has-text('SPPM')").first();
    await productLink.click();
    await page.waitForTimeout(3000);
    // 상세 페이지에 물성 데이터 또는 제품명 표시
    await expect(page.locator("text=물성").or(page.locator("text=압축강도")).or(page.locator("text=시공방법")).first()).toBeVisible({ timeout: 10000 });
  });

  test("제품 상세에서 관련 규격 링크 표시", async ({ page }) => {
    await page.goto("/products");
    await page.waitForTimeout(3000);
    const productLink = page.locator("a:has-text('SG 45N')").first();
    await productLink.click();
    await page.waitForTimeout(3000);
    await expect(page.locator("text=KS F 4044").or(page.locator("text=규격")).first()).toBeVisible({ timeout: 10000 });
  });
});

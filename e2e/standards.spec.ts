import { test, expect } from "@playwright/test";

test.describe("규격/표준", () => {
  test("목록에서 카테고리별 그룹핑 (KS, EN, ASTM 등)", async ({ page }) => {
    await page.goto("/wiki/standards");
    await page.waitForTimeout(3000);
    await expect(page.locator("span:has-text('KS')").first()).toBeVisible();
    await expect(page.locator("span:has-text('EN')").first()).toBeVisible();
  });

  test("규격 코드 클릭 → 상세 페이지 이동", async ({ page }) => {
    await page.goto("/wiki/standards");
    await page.waitForTimeout(3000);
    // 테이블 첫 번째 열의 규격 코드 링크 클릭
    await page.locator("td a.font-medium").first().click();
    await page.waitForTimeout(3000);
    // 상세 페이지에 "개요" 또는 "규격 정보" 섹션 표시
    await expect(page.locator("text=개요").or(page.locator("text=규격 정보")).first()).toBeVisible({ timeout: 10000 });
  });

  test("상세 페이지에서 관련 제품 링크", async ({ page }) => {
    await page.goto("/wiki/standards");
    await page.waitForTimeout(3000);
    await page.getByRole("link", { name: "KS F 4044" }).first().click();
    await page.waitForTimeout(3000);
    await expect(page.locator("text=관련 제품").first()).toBeVisible({ timeout: 10000 });
  });

  test("상세 페이지에서 '규격/표준 목록' 뒤로가기 링크", async ({ page }) => {
    await page.goto("/wiki/standards");
    await page.waitForTimeout(3000);
    await page.getByRole("link", { name: "KS F 4042" }).first().click();
    await page.waitForTimeout(3000);
    await expect(page.getByRole("link", { name: "규격/표준 목록" })).toBeVisible();
  });
});

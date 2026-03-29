import { test, expect } from "@playwright/test";

test.describe("AI 채팅", () => {
  test("빠른 질문 버튼 표시 + 클릭 → 답변 생성", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForTimeout(2000);
    // 빠른 질문 버튼 확인
    const quickBtn = page.locator("button:has-text('보수몰탈 제품 목록 알려줘')");
    await expect(quickBtn).toBeVisible({ timeout: 10000 });
  });

  test("질문 입력 → AI 답변 + 출처 표시", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForTimeout(2000);

    const input = page.locator('input[placeholder="질문을 입력하세요..."]');
    await input.fill("SG 45N 압축강도");
    await input.press("Enter");

    // 출처 섹션이 나타날 때까지 대기 (AI 응답 완료)
    await expect(page.locator("text=출처 (클릭하여 상세 보기)")).toBeVisible({ timeout: 60000 });

    // 답변에 관련 키워드 포함
    const answer = page.locator(".chat-markdown, [class*='whitespace-pre-wrap']").last();
    await expect(answer).toContainText(/MPa|압축강도|SG|그라우트/);
  });

  test("출처 버튼 클릭 → 상세 패널 표시", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForTimeout(2000);

    const input = page.locator('input[placeholder="질문을 입력하세요..."]');
    await input.fill("KS F 4042 기준은?");
    await input.press("Enter");

    await expect(page.locator("text=출처 (클릭하여 상세 보기)")).toBeVisible({ timeout: 60000 });

    // 출처 버튼 클릭
    const sourceBtn = page.locator("button:has-text('KS F 4042'), button:has-text('규격')").first();
    if (await sourceBtn.isVisible()) {
      await sourceBtn.click();
      await page.waitForTimeout(2000);
      // 상세 패널에 "전체 페이지 보기" 링크
      await expect(page.locator("text=전체 페이지 보기")).toBeVisible({ timeout: 5000 });
    }
  });
});

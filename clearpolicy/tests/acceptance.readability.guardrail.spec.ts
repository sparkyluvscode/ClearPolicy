import { test, expect } from "@playwright/test";

test.describe("Readability guardrail @acceptance", () => {
  test("key text blocks are fully opaque", async ({ page }) => {
    const expectReadable = async (locator: ReturnType<typeof page.getByTestId>) => {
      await expect(locator).toBeVisible();
      const opacity = await locator.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeGreaterThanOrEqual(0.9);
      const cls = (await locator.getAttribute("class")) || "";
      expect(cls).not.toContain("opacity-50");
      expect(cls).not.toContain("text-transparent");
    };

    await page.addInitScript(() => {
      window.localStorage.setItem("cp_tour_seen", "1");
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expectReadable(page.getByTestId("home-title"));
    await expectReadable(page.getByTestId("home-subtitle"));

    await page.getByTestId("search-input").fill("education");
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("search-results")).toBeVisible();
    await expectReadable(page.getByTestId("result-title").first());

    await page.goto("/measure/ca-prop-17-2020");
    await page.waitForLoadState("networkidle");

    await expectReadable(page.getByTestId("measure-title"));
    await expectReadable(page.getByTestId("measure-summary"));

    const evidenceMetric = page.getByTestId("evidence-metric").first();
    if (await evidenceMetric.count()) {
      await expectReadable(evidenceMetric);
    }

    await expectReadable(page.getByTestId("zip-helper"));
  });
});

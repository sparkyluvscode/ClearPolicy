import { test, expect } from "@playwright/test";
import { clickLevel } from "./helpers";

test.describe("Readability guardrail @acceptance", () => {
  test("reading level toggle changes summary text (5th, 8th, 12th)", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cp_tour_seen", "1");
    });
    await page.goto("/measure/prop/17");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("measure-summary")).toBeVisible();
    const getTldrText = () =>
      page.locator('[class*="section-title"]').filter({ hasText: "TL;DR" }).locator("..").locator("p").first().textContent();
    await clickLevel(page, "8");
    await page.waitForTimeout(300);
    const text8 = (await getTldrText())?.trim() || "";
    await clickLevel(page, "5");
    await page.waitForTimeout(300);
    const text5 = (await getTldrText())?.trim() || "";
    await clickLevel(page, "12");
    await page.waitForTimeout(300);
    const text12 = (await getTldrText())?.trim() || "";
    expect(text5.length).toBeGreaterThan(0);
    expect(text8.length).toBeGreaterThan(0);
    expect(text12.length).toBeGreaterThan(0);
    const allSame = text5 === text8 && text8 === text12;
    expect(allSame, "5th, 8th, and 12th grade content should differ").toBe(false);
  });

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

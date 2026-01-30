import { test, expect } from "@playwright/test";
import { clickLevel } from "./helpers";

test.describe("Critical fixes – new test cases @acceptance", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cp_tour_seen", "1");
    });
  });

  // —— Reading level content adaptation ——
  test("5th, 8th, 12th grade toggles produce different summary text on Prop 17", async ({ page }) => {
    await page.goto("/measure/prop/17");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("measure-summary")).toBeVisible();

    const getTldrText = () =>
      page
        .locator('[class*="section-title"]')
        .filter({ hasText: "TL;DR" })
        .locator("..")
        .locator("p")
        .first()
        .textContent();

    await clickLevel(page, "5");
    await page.waitForTimeout(400);
    const text5 = (await getTldrText())?.trim() || "";
    await clickLevel(page, "8");
    await page.waitForTimeout(400);
    const text8 = (await getTldrText())?.trim() || "";
    await clickLevel(page, "12");
    await page.waitForTimeout(400);
    const text12 = (await getTldrText())?.trim() || "";

    expect(text5.length).toBeGreaterThan(0);
    expect(text8.length).toBeGreaterThan(0);
    expect(text12.length).toBeGreaterThan(0);
    const allSame = text5 === text8 && text8 === text12;
    expect(allSame, "5th, 8th, and 12th grade TL;DR should differ").toBe(false);
  });

  test("reading level changes WHAT IT DOES section on Prop 65", async ({ page }) => {
    await page.goto("/measure/prop/65");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("measure-summary")).toBeVisible();

    const getWhatSection = () =>
      page
        .locator('[class*="section-title"]')
        .filter({ hasText: /What it does/i })
        .locator("..")
        .locator("p")
        .first()
        .textContent();

    await clickLevel(page, "5");
    await page.waitForTimeout(400);
    const what5 = (await getWhatSection())?.trim() || "";
    await clickLevel(page, "12");
    await page.waitForTimeout(400);
    const what12 = (await getWhatSection())?.trim() || "";

    expect(what5.length).toBeGreaterThan(0);
    expect(what12.length).toBeGreaterThan(0);
    expect(what5 === what12, "5th vs 12th grade 'What it does' should differ").toBe(false);
  });

  // —— Search timeout / no indefinite hang ——
  test("search resolves within 6s – SB 1047 shows results or error (no infinite wait)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("SB 1047");
    await page.keyboard.press("Enter");

    // Within 6s we must see either: results area, or search-error (timeout/failure). Use .first() to avoid strict mode when both exist.
    const resultsOrError = page.locator('[data-testid="search-results"], [data-testid="search-error"]').first();
    await expect(resultsOrError).toBeVisible({ timeout: 6500 });
    const loading = page.getByTestId("search-results-loading");
    // After results/error visible, loading indicator should disappear soon
    await expect(loading).toBeHidden({ timeout: 3000 });
  });

  test("search for Prop 65 shows results or no-results (no hang)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("search-input").fill("Prop 65");
    await page.keyboard.press("Enter");

    const resultsSection = page.getByTestId("search-results");
    await expect(resultsSection).toBeVisible({ timeout: 6000 });
    const hasError = await page.getByTestId("search-error").isVisible().catch(() => false);
    const hasLinks = await page.getByRole("link", { name: /Open summary/i }).count() > 0;
    const hasNoResults = await page.getByText(/No results for/).isVisible().catch(() => false);
    expect(hasError || hasLinks || hasNoResults, "Search must show either results, no-results, or error").toBe(true);
  });

  test("search for Inflation Reduction Act shows results or error within 6s", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("search-input").fill("Inflation Reduction Act");
    await page.keyboard.press("Enter");

    await expect(
      page.locator('[data-testid="search-results"], [data-testid="search-error"]').first()
    ).toBeVisible({ timeout: 6500 });
  });

  // —— Page load: skeleton then content ——
  test("measure prop page shows skeleton then summary (or finishes within 4s)", async ({ page }) => {
    const nav = page.goto("/measure/prop/17");
    // Skeleton may appear first (suspense)
    const skeleton = page.getByTestId("measure-loading");
    const summary = page.getByTestId("measure-summary");

    await nav;
    // Either we see skeleton then summary, or summary directly (fast server)
    const skeletonSeen = await skeleton.isVisible().catch(() => false);
    await expect(summary).toBeVisible({ timeout: 4000 });
    if (skeletonSeen) {
      await expect(skeleton).toBeHidden({ timeout: 3000 });
    }
  });

  test("measure prop 65 loads with summary within 4s", async ({ page }) => {
    await page.goto("/measure/prop/65");
    await expect(page.getByTestId("measure-summary")).toBeVisible({ timeout: 4000 });
  });

  // —— Trust messaging ——
  test("proposition detail shows Official summary or trusted source messaging", async ({ page }) => {
    await page.goto("/measure/prop/17");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("measure-summary")).toBeVisible();
    await expect(
      page.getByText(/Official summary|cited sources|trusted sources/i).first()
    ).toBeVisible();
  });

  // —— Nationwide browsing ——
  test("browse page has heading Browse Legislation and By level filter", async ({ page }) => {
    await page.goto("/browse");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Browse Legislation" })).toBeVisible();
    await expect(page.getByText("By level")).toBeVisible();
    const byLevelSection = page.locator("span.section-title", { hasText: "By level" }).locator("..");
    await expect(byLevelSection.getByRole("button", { name: "All" })).toBeVisible();
    await expect(byLevelSection.getByRole("button", { name: "Federal" })).toBeVisible();
    await expect(byLevelSection.getByRole("button", { name: "California" })).toBeVisible();
  });

  test("browse All shows both Federal and California sections", async ({ page }) => {
    await page.goto("/browse");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Federal \(Congress\.gov\)/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /California ballot measures/i })).toBeVisible();
  });

  test("browse Federal filter shows only federal bills", async ({ page }) => {
    await page.goto("/browse");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Federal" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { name: /Federal \(Congress\.gov\)/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /California ballot measures/i })).toHaveCount(0);
  });

  test("browse California filter shows only California propositions", async ({ page }) => {
    await page.goto("/browse");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "California" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { name: /California ballot measures/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Federal \(Congress\.gov\)/i })).toHaveCount(0);
  });

  // —— Mobile 375px ——
  test("browse and search work at 375px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Find a bill|Search/ })).toBeVisible();
    await page.goto("/browse");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Browse Legislation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Federal" })).toBeVisible();
  });
});

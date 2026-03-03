import { test, expect } from "@playwright/test";

/**
 * My Research / Saved Searches E2E Test
 *
 * Verifies: After signing in and searching, the search appears in My Research (/history).
 *
 * HOW TO RUN:
 * 1. Ensure dev server: cd clearpolicy && npm run dev
 *
 * Option A - One-time auth setup + automated test:
 *   npx playwright test tests/acceptance.my-research.spec.ts -g "auth-setup" --headed
 *   (Sign in when browser opens, click Resume in Playwright Inspector)
 *   npx playwright test tests/acceptance.my-research.spec.ts -g "signed-in search" --project=chromium
 *
 * Option B - Fully manual (pause at sign-in):
 *   npx playwright test tests/acceptance.my-research.spec.ts --headed --project=chromium
 */

test.describe("My Research - saved searches @acceptance", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cp_tour_seen", "1");
    });
  });

  test("auth-setup: sign in and save session", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.waitForLoadState("load");
    const myResearchLink = page.getByRole("link", { name: "My Research" });
    if (await myResearchLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.context().storageState({ path: ".auth/user.json" });
      return;
    }
    await page.goto("/sign-in");
    await page.waitForLoadState("load");
    await page.pause(); // Sign in manually, then Resume
    await page.waitForURL((url) => !url.pathname.includes("sign-in"), {
      timeout: 60_000,
    });
    await page.context().storageState({ path: ".auth/user.json" });
  });

  test("signed-in search appears in My Research", async ({ page }) => {
    test.setTimeout(120_000);

    const searchQuery = "Fifth Amendment";

    // Start at home
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Dismiss welcome modal if present
    const welcomeOverlay = page.getByRole("heading", {
      name: "Welcome to ClearPolicy",
    });
    if (await welcomeOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      const gotIt = page.getByRole("button", {
        name: /Got it|Close|Skip/i,
      });
      if (await gotIt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await gotIt.click();
        await page.waitForTimeout(500);
      }
    }

    // If not signed in, pause for manual sign-in
    const myResearchLink = page.getByRole("link", { name: "My Research" });
    if (!(await myResearchLink.isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.goto("/sign-in");
      await page.waitForLoadState("load"); // Clerk page - avoid networkidle (has persistent connections)
      await page.pause(); // User signs in, then resumes
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    }

    // Find search input and search
    const searchInput = page
      .locator("[data-search-input]")
      .or(page.getByPlaceholder(/Ask anything about policy|search/i));
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
    await searchInput.first().fill(searchQuery);

    const searchButton = page.getByRole("button", { name: "Search" });
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click();
    } else {
      await page.keyboard.press("Enter");
    }

    // Wait for /search and results
    await expect(page).toHaveURL(/\/search\?/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Wait for search results (policy name, sources, or cited count)
    const policyContent = page
      .getByText(/Fifth Amendment|sources|cited/i)
      .first();
    await expect(policyContent).toBeVisible({ timeout: 30000 });

    // Allow save-search fallback to complete (includes retry)
    await page.waitForTimeout(5000);

    // Go to My Research
    await page.goto("/history");
    await page.waitForLoadState("networkidle");

    // Screenshot
    await page.screenshot({
      path: "test-results/my-research-history.png",
      fullPage: true,
    });

    // Verify: search appears in list (policy name often includes query)
    const searchAppears = page.getByText(/Fifth Amendment|Fifth/i);
    const noResearchYet = page.getByText("No research yet");

    const searchVisible = await searchAppears.isVisible().catch(() => false);
    const noResearchVisible = await noResearchYet.isVisible().catch(() => false);

    if (noResearchVisible && !searchVisible) {
      throw new Error(
        `Save failed: Search "${searchQuery}" did not appear in My Research. ` +
          `Saw "No research yet". Screenshot: test-results/my-research-history.png`
      );
    }

    expect(
      searchVisible,
      `Expected "${searchQuery}" in My Research. Screenshot: test-results/my-research-history.png`
    ).toBe(true);
  });
});

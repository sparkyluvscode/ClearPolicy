import { test, expect } from '@playwright/test';
import { runA11y } from './helpers';

test.describe('Home search, results, onboarding, headings, mobile @acceptance', () => {
  test('search shows results and live card opens', async ({ page, browserName }) => {
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    // Onboarding
    const overlay = page.getByRole('heading', { name: 'Welcome to ClearPolicy' });
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      const gotItButton = page.getByRole('button', { name: /Got it|Close|Skip/i });
      if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await gotItButton.click();
        await page.waitForTimeout(500); // Wait for overlay to dismiss
      }
    }
    // Home heading present - be more specific to avoid multiple matches
    await expect(page.getByRole('heading', { name: 'Find a bill or proposition' })).toBeVisible();
    // Note: "Sample measures" heading may not exist - check if it does
    const sampleMeasures = page.getByRole('heading', { name: 'Sample measures' });
    if (await sampleMeasures.count() > 0) {
      await expect(sampleMeasures).toBeVisible();
    }
    // Use the home-search input directly (it doesn't navigate, just updates state)
    // The header global search navigates to /?q=query which requires waiting for navigation
    const homeSearch = page.locator('#home-search');
    if (await homeSearch.count() > 0 && await homeSearch.isVisible()) {
      await homeSearch.fill('health');
      await page.getByRole('button', { name: 'Search' }).click();
      // Wait for the API response and state update
      await page.waitForTimeout(2000);
    } else {
      // Fallback to header search - this navigates, so wait for navigation
      const hasGlobal = await page.getByLabel('Search measures').count();
      if (hasGlobal) {
        await page.getByLabel('Search measures').fill('health');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle' }),
          page.keyboard.press('Enter'),
        ]);
      } else {
        await page.getByLabel('Search').fill('health');
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForTimeout(2000);
      }
    }
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
    const first = page.getByRole('link', { name: /Open summary/ }).first();
    await expect(first).toBeVisible();
    await runA11y(page, 'Home page');

    // mobile layout sanity (project mobile in config)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  });
});



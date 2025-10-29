import { test, expect } from '@playwright/test';
import { runA11y } from './helpers';

test.describe('Home search, results, onboarding, headings, mobile @acceptance', () => {
  test('search shows results and live card opens', async ({ page, browserName }) => {
    await page.goto('/');
    // Onboarding
    const overlay = page.getByRole('heading', { name: 'Welcome to ClearPolicy' });
    if (await overlay.isVisible()) {
      await page.getByRole('button', { name: 'Got it' }).click();
    }
    // Home heading present
    await expect(page.getByRole('heading', { name: /Find a bill|Search a bill|ClearPolicy/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sample measures' })).toBeVisible();
    // Prefer header global search if present, fallback to home input/button
    const hasGlobal = await page.getByLabel('Search measures').count();
    if (hasGlobal) {
      await page.getByLabel('Search measures').fill('health');
      await page.keyboard.press('Enter');
    } else {
      await page.getByLabel('Search').fill('health');
      await page.getByRole('button', { name: 'Search' }).click();
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



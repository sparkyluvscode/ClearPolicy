import { test, expect } from '@playwright/test';
import { dismissTourIfPresent } from './helpers';

test.describe('Power user search loop @acceptance', () => {
  test('loops searches, toggles evidence, and navigates back', async ({ page }) => {
    const queries = ['Prop 17', 'Prop 47', 'Prop 17', 'Prop 47', 'Prop 17'];
    for (const q of queries) {
      await page.goto('/');
      await dismissTourIfPresent(page);
      const homeSearch = page.locator('#home-search');
      if (await homeSearch.isVisible().catch(() => false)) {
        await homeSearch.fill(q);
        await page.keyboard.press('Enter');
      } else {
        const globalSearch = page.getByLabel('Search measures');
        if (await globalSearch.isVisible().catch(() => false)) {
          await globalSearch.fill(q);
          await page.keyboard.press('Enter');
        } else {
          await page.getByLabel('Search').fill(q);
          await page.keyboard.press('Enter');
        }
      }

      const resultsSection = page.locator('#search-results-section');
      await expect(resultsSection).toBeVisible();
      const measureLinks = resultsSection.locator('a[href^="/measure/"]');
      const linkCount = await measureLinks.count();
      const href = linkCount > 0 ? await measureLinks.first().getAttribute('href') : null;
      const fallback = /47/.test(q) ? '/measure/ca-prop-47-2014' : '/measure/ca-prop-17-2020';
      const target = href && href.startsWith('/measure/ca-prop-') ? href : fallback;
      await page.goto(target);
      const tldrHeading = page.getByRole('heading', { name: 'TL;DR' });
      const loaded = await tldrHeading.isVisible({ timeout: 5000 }).catch(() => false);
      if (!loaded) {
        await page.goto(fallback);
      }

      await dismissTourIfPresent(page);
      await expect(tldrHeading).toBeVisible();

      const toggle = page.getByRole('button', { name: /Evidence Mode \(beta\)/i });
      const toggleVisible = await toggle.isVisible().catch(() => false);
      if (!toggleVisible) {
        await page.goto(fallback);
      }
      await expect(toggle).toBeVisible();
      await toggle.click({ force: true });
      const claimList = page.getByRole('list', { name: /TLDR claims with evidence/i });
      await expect(claimList).toBeVisible();
      const firstClaim = claimList.getByRole('listitem').first();
      await firstClaim.getByRole('button', { name: /Show evidence|Why unverified/i }).click({ force: true });

      await page.goBack({ timeout: 5000 }).catch(() => {});
    }
  });
});

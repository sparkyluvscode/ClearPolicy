import { test, expect } from '@playwright/test';
import { dismissTourIfPresent } from './helpers';

test.describe('Visual sanity @acceptance', () => {
  test('home, results, measure summary are visible and readable', async ({ page }) => {
    await page.goto('/');
    await dismissTourIfPresent(page);

    await expect(page.getByTestId('home-title')).toBeVisible();
    await expect(page.getByTestId('search-input')).toBeVisible();

    await page.getByTestId('search-input').fill('Prop 17');
    await page.getByTestId('search-submit').click();

    const results = page.getByTestId('search-results');
    await expect(results).toBeVisible();
    let firstTitle = results.getByTestId('result-title').first();
    const count = await results.getByTestId('result-title').count();
    if (count === 0) {
      await page.getByTestId('search-input').fill('Prop 47');
      await page.getByTestId('search-submit').click();
      await expect(results).toBeVisible();
      firstTitle = results.getByTestId('result-title').first();
    }
    await expect(firstTitle).toBeVisible();

    const titleOpacity = await firstTitle.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(titleOpacity)).toBeGreaterThanOrEqual(0.9);

    const firstMeasureLink = results.locator('a[href^="/measure/"]').first();
    await firstMeasureLink.click();
    await dismissTourIfPresent(page);

    const summary = page.getByTestId('measure-summary');
    await expect(summary).toBeVisible();
    const summaryParagraph = summary.locator('p').first();
    await expect(summaryParagraph).toBeVisible();
    const summaryOpacity = await summaryParagraph.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(summaryOpacity)).toBeGreaterThanOrEqual(0.9);
  });
});

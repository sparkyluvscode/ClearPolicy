import { test, expect } from '@playwright/test';
import { runA11y, clickLevel } from './helpers';

const samples = [
  { slug: 'ca-prop-17-2020', title: 'Prop 17' },
  { slug: 'ca-prop-47-2014', title: 'Prop 47' },
];

for (const s of samples) {
  test.describe(`Sample card ${s.slug} parity & content @acceptance`, () => {
    test('structure, levels, citations, zip', async ({ page }) => {
      await page.goto(`/measure/${s.slug}`);
      const overlay = page.getByRole('heading', { name: 'Welcome to ClearPolicy' });
      if (await overlay.isVisible()) {
        await page.getByRole('button', { name: 'Got it' }).click();
      }
      await expect(page.getByRole('heading', { name: /Summary/ })).toBeVisible();
      await expect(page.getByRole('group', { name: /Reading level/ })).toBeVisible();
      await clickLevel(page, '12');
      const tldr = page.getByRole('heading', { name: 'TL;DR' }).locator('..').locator('p').first();
      const t12 = await tldr.textContent();
      await clickLevel(page, '5');
      const t5 = await tldr.textContent();
      expect.soft((t5 || '').length).toBeLessThanOrEqual((t12 || '').length);
      await page.getByRole('button', { name: /Show cited lines/ }).click();
      await expect(page.locator('blockquote').first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Local lens' })).toBeVisible();
      // ZIP valid
      await page.getByPlaceholder(/Enter ZIP/).fill('95014');
      await page.getByRole('button', { name: 'Look up' }).click();
      await expect(page.getByRole('list')).toBeVisible();
      // invalid
      await page.getByPlaceholder(/Enter ZIP/).fill('00000');
      await page.getByRole('button', { name: 'Look up' }).click();
      await expect(page.getByText(/ZIP code not found|Enter a 5-digit ZIP/)).toBeVisible();
      await runA11y(page, `Sample ${s.slug}`);
    });
  });
}



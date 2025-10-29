import { test, expect } from '@playwright/test';
import { runA11y, clickLevel, gotoLiveExample } from './helpers';

test.describe('Live measure card - content, levels, citations, a11y @acceptance', () => {
  test('sections have meaningful content; levels differ; citations expand; source meter visible', async ({ page }) => {
    await gotoLiveExample(page);

    // Section presence and non-empty checks
    const sections = [
      { name: 'TL;DR', locator: page.getByRole('heading', { name: 'TL;DR' }).locator('..').locator('p').first() },
      { name: 'What it does', locator: page.getByRole('heading', { name: 'What it does' }).locator('..').locator('p').first() },
      { name: 'Who is affected', locator: page.getByRole('heading', { name: 'Who is affected' }).locator('..').locator('p').first() },
      { name: 'Pros', locator: page.getByRole('heading', { name: 'Pros' }).locator('..').locator('p').first() },
      { name: 'Cons', locator: page.getByRole('heading', { name: 'Cons' }).locator('..').locator('p').first() },
    ];
    for (const s of sections) {
      await expect.soft(s.locator, `${s.name} missing`).toBeVisible();
      const text = (await s.locator.textContent())?.trim() || '';
      expect.soft(text.length, `${s.name} empty`).toBeGreaterThan(10);
      expect.soft(/(This measure updates|No summary available)/.test(text)).toBeFalsy();
    }

    // Reading level differences
    const tldr = sections[0].locator;
    const text12 = await tldr.textContent();
    await clickLevel(page, '8');
    const text8 = await tldr.textContent();
    await clickLevel(page, '5');
    const text5 = await tldr.textContent();
    expect.soft(text12 && text8 && text5).toBeTruthy();
    expect.soft((text5 || '').length).toBeLessThan((text8 || '').length);
    expect.soft((text8 || '').length).toBeLessThan((text12 || '').length);

    // Citations
    await page.getByRole('button', { name: /Show cited lines/i }).click();
    const firstQuote = page.locator('blockquote').first();
    await expect.soft(firstQuote).toBeVisible();
    const sourceList = page.getByRole('list').filter({ hasText: /Source|Open States|Congress/ });
    await expect.soft(sourceList.first()).toBeVisible();

    // Source meter present
    await expect(page.getByText('Source Meter')).toBeVisible();

    // Axe accessibility
    await runA11y(page, 'Live measure page');
  });
});



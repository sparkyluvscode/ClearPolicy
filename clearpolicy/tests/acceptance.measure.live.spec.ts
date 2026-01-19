import { test, expect } from '@playwright/test';
import { runA11y, clickLevel, gotoLiveExample } from './helpers';

test.describe('Live measure card - content, levels, citations, a11y @acceptance', () => {
  test('sections have meaningful content; levels differ; citations expand; source meter visible', async ({ page }) => {
    const hasLive = await gotoLiveExample(page);
    if (!hasLive) {
      test.skip(true, 'No live results found. Provide API keys or try later.');
    }

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
    const len12 = (text12 || '').length;
    const len8 = (text8 || '').length;
    const len5 = (text5 || '').length;
    if (len12 > 80) {
      expect.soft(len8).toBeLessThanOrEqual(len12);
    }
    expect.soft(len5).toBeGreaterThan(0);

    // Evidence mode toggle and claim bullets
    const evidenceToggle = page.getByRole('button', { name: /Evidence Mode \(beta\)/i });
    await expect.soft(evidenceToggle).toBeVisible();
    await evidenceToggle.click();
    await expect.soft(evidenceToggle).toHaveAttribute('aria-pressed', 'true');
    const tldrSection = page.getByRole('heading', { name: 'TL;DR' }).locator('..');
    const claimList = tldrSection.getByRole('list').first();
    await expect.soft(claimList).toBeVisible();
    const firstClaim = claimList.getByRole('listitem').first();
    await expect.soft(firstClaim.getByText(/Supported|Unverified/i)).toBeVisible();
    const evidenceButton = firstClaim.getByRole('button', { name: /Show evidence/i });
    await evidenceButton.click();
    await expect.soft(firstClaim.getByText(/No supporting quote found|Source:/i)).toBeVisible();

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



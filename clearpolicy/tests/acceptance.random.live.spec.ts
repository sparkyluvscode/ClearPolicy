import { test, expect } from '@playwright/test';
import { runA11y, clickLevel } from './helpers';

async function collectLiveLinks(page, queries: string[], max = 5): Promise<string[]> {
  const links: string[] = [];
  for (const q of queries) {
    await page.goto('/');
    const hasGlobal = await page.getByLabel('Search measures').count();
    if (hasGlobal) {
      await page.getByLabel('Search measures').fill(q);
      await page.keyboard.press('Enter');
    } else {
      await page.getByLabel('Search').fill(q);
      await page.getByRole('button', { name: 'Search' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
    const items = page.getByRole('link', { name: /Open summary/ });
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const href = await items.nth(i).getAttribute('href');
      if (href && href.startsWith('/measure/live')) {
        if (!links.includes(href)) links.push(href);
      }
      if (links.length >= max) return links;
    }
  }
  return links;
}

async function validateLiveCard(page) {
  // Headings
  await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible();
  await expect(page.getByText('Source Meter')).toBeVisible();

  const sections = [
    { name: 'TL;DR' },
    { name: 'What it does' },
    { name: 'Who is affected' },
    { name: 'Pros' },
    { name: 'Cons' },
  ];
  for (const s of sections) {
    const p = page.getByRole('heading', { name: s.name }).locator('..').locator('p').first();
    await expect.soft(p, `${s.name} missing`).toBeVisible();
    const text = (await p.textContent())?.trim() || '';
    expect.soft(text.length, `${s.name} empty`).toBeGreaterThan(10);
    expect.soft(/^(This measure updates|No summary available)/.test(text), `${s.name} uses placeholder`).toBeFalsy();
  }

  // Reading levels change content
  const tldrP = page.getByRole('heading', { name: 'TL;DR' }).locator('..').locator('p').first();
  await clickLevel(page, '12');
  const t12 = (await tldrP.textContent()) || '';
  await clickLevel(page, '8');
  const t8 = (await tldrP.textContent()) || '';
  await clickLevel(page, '5');
  const t5 = (await tldrP.textContent()) || '';
  expect.soft(t5.length).toBeLessThanOrEqual(t8.length);
  expect.soft(t8.length).toBeLessThanOrEqual(t12.length);

  // Citations expand
  const toggle = page.getByRole('button', { name: /Show cited lines/i });
  await toggle.click();
  await expect.soft(page.locator('blockquote').first()).toBeVisible();

  // Source links are non-generic
  const sourceAnchors = page.locator('a', { hasText: /Source:|Open States|Congress/ });
  const anchorCount = await sourceAnchors.count();
  for (let i = 0; i < Math.min(anchorCount, 5); i++) {
    const href = await sourceAnchors.nth(i).getAttribute('href');
    expect.soft(href && /https?:\/\//.test(href || ''), 'Source href missing').toBeTruthy();
  }

  await runA11y(page, 'Random live');
}

test.describe('Five random live bills @acceptance', () => {
  test('validate up to 5 live cards across queries', async ({ page }) => {
    const queries = ['education', 'health', 'tax', 'election', 'climate', 'budget', 'transportation'];
    const links = await collectLiveLinks(page, queries, 5);
    test.info().annotations.push({ type: 'collected-links', description: JSON.stringify(links) });
    if (links.length === 0) {
      test.skip(true, 'No live results found. Provide API keys or try later.');
    }
    for (const href of links) {
      await page.goto(href);
      await validateLiveCard(page);
    }
  });
});



import { test, expect } from '@playwright/test';
import { runA11y, clickLevel, dismissTourIfPresent } from './helpers';

async function collectLiveLinks(page, queries: string[], max = 5): Promise<string[]> {
  const links: string[] = [];
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
    const items = page.getByRole('link', { name: /Open summary/ });
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const href = await items.nth(i).getAttribute('href');
      if (href && href.startsWith('/measure/live')) {
        if (!links.includes(href)) links.push(href);
      }
      if (links.length >= max) return links;
    }
    if (links.length === 0) {
      const apiLinks = await getLiveLinksFromApi(page, q, max);
      for (const href of apiLinks) {
        if (!links.includes(href)) links.push(href);
        if (links.length >= max) return links;
      }
    }
  }
  return links;
}

async function getLiveLinksFromApi(page, query: string, max: number): Promise<string[]> {
  try {
    const res = await page.request.get(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok()) return [];
    const data: any = await res.json();
    const usBills = Array.isArray(data?.us?.bills)
      ? data.us.bills
      : Array.isArray(data?.us?.data?.bills)
        ? data.us.data.bills
        : [];
    const links: string[] = [];
    for (const b of usBills.slice(0, max)) {
      const id = `${b.congress || b.congressdotgovUrl?.match(/congress=(\d+)/)?.[1] || "118"}:${b.type || b.billType || "hr"}:${String(b.number || "").replace(/\D/g, "") || "0"}`;
      links.push(`/measure/live?source=congress&id=${encodeURIComponent(id)}`);
    }
    const caResults = Array.isArray(data?.ca?.results) ? data.ca.results : [];
    for (const r of caResults.slice(0, max)) {
      const osId = r.id || r.identifier || "";
      if (osId) links.push(`/measure/live?source=os&id=${encodeURIComponent(osId)}`);
    }
    return links.slice(0, max);
  } catch {
    return [];
  }
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
  if (t12.length > 80) {
    expect.soft(t8.length).toBeLessThanOrEqual(t12.length);
  }
  expect.soft(t5.length).toBeGreaterThan(0);

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



import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function clearBackdrops(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('div.fixed.inset-0, .glass-nav + div').forEach((el) => {
      el.remove();
    });
  }).catch(() => {});
}

export async function runA11y(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).
    disableRules(['color-contrast']) // allow brand color for now
    .analyze();
  const critical = results.violations.filter(v => ['serious', 'critical'].includes(v.impact || '')); 
  expect(critical, `${context} has critical a11y violations`).toEqual([]);
}

export async function clickLevel(page: Page, level: '5'|'8'|'12') {
  const label = level === '5' ? '5th' : level === '8' ? '8th' : '12th';
  await clearBackdrops(page);
  await page.getByRole('button', { name: label }).click({ force: true });
}

export async function dismissTourIfPresent(page: Page) {
  const overlayHeading = page.getByRole('heading', { name: 'Welcome to ClearPolicy' });
  const gotIt = page.getByRole('button', { name: 'Got it' });
  const visible = await overlayHeading.isVisible({ timeout: 1000 }).catch(() => false);
  if (!visible) return;
  await gotIt.click({ timeout: 2000, force: true }).catch(() => {});
  await overlayHeading.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  // Clear any remaining backdrop intercepting clicks
  await clearBackdrops(page);
}

export async function gotoLiveExample(page: Page): Promise<boolean> {
  await page.goto('/');
  await dismissTourIfPresent(page);
  // Ensure overlays/backdrops are cleared before interacting
  await page.keyboard.press('Escape').catch(() => {});
  await clearBackdrops(page);
  const homeSearch = page.locator('#home-search');
  if (await homeSearch.isVisible().catch(() => false)) {
    await homeSearch.fill('education');
    await page.keyboard.press('Enter');
  } else {
    const globalSearch = page.getByLabel('Search measures');
    if (await globalSearch.isVisible().catch(() => false)) {
      await globalSearch.fill('education');
      await page.keyboard.press('Enter');
    }
  }
  const resultsSection = page.locator('#search-results-section');
  await expect(resultsSection).toBeVisible();
  const link = page.locator('a[href^="/measure/live"]').first();
  const hasLive = await link.isVisible().catch(() => false);
  if (!hasLive) {
    const apiLink = await getLiveLinkFromApi(page, 'education');
    if (!apiLink) return false;
    await page.goto(apiLink);
  } else {
    await link.click();
  }
  await dismissTourIfPresent(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Summary' })).toBeVisible();
  return true;
}

async function getLiveLinkFromApi(page: Page, query: string): Promise<string | null> {
  try {
    const res = await page.request.get(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok()) return null;
    const data: any = await res.json();
    const usBills = Array.isArray(data?.us?.bills)
      ? data.us.bills
      : Array.isArray(data?.us?.data?.bills)
        ? data.us.data.bills
        : [];
    if (usBills.length > 0) {
      const b = usBills[0];
      const id = `${b.congress || b.congressdotgovUrl?.match(/congress=(\d+)/)?.[1] || "118"}:${b.type || b.billType || "hr"}:${String(b.number || "").replace(/\D/g, "") || "0"}`;
      return `/measure/live?source=congress&id=${encodeURIComponent(id)}`;
    }
    const caResults = Array.isArray(data?.ca?.results) ? data.ca.results : [];
    if (caResults.length > 0) {
      const r = caResults[0];
      const osId = r.id || r.identifier || "";
      return osId ? `/measure/live?source=os&id=${encodeURIComponent(osId)}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isGenericSource(url: string): boolean {
  try {
    const u = new URL(url, 'http://localhost');
    const genericRoots = [
      'openstates.org',
      'www.openstates.org',
      'congress.gov',
      'www.congress.gov',
    ];
    if (!u.protocol.startsWith('http')) return true;
    if (genericRoots.includes(u.hostname) && (!u.pathname || u.pathname === '/')) return true;
    return false;
  } catch {
    return true;
  }
}




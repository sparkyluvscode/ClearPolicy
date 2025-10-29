import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export async function runA11y(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).
    disableRules(['color-contrast']) // allow brand color for now
    .analyze();
  const critical = results.violations.filter(v => ['serious', 'critical'].includes(v.impact || '')); 
  expect(critical, `${context} has critical a11y violations`).toEqual([]);
}

export async function clickLevel(page: Page, level: '5'|'8'|'12') {
  const label = level === '5' ? '5th' : level === '8' ? '8th' : '12th';
  await page.getByRole('button', { name: label }).click();
}

export async function dismissTourIfPresent(page: Page) {
  const overlayHeading = page.getByRole('heading', { name: 'Welcome to ClearPolicy' });
  if (await overlayHeading.isVisible()) {
    await page.getByRole('button', { name: 'Got it' }).click();
    await overlayHeading.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  }
}

export async function gotoLiveExample(page: Page) {
  await page.goto('/');
  await dismissTourIfPresent(page);
  const homeSearch = page.locator('#home-search');
  if (await homeSearch.count()) {
    await homeSearch.fill('education');
    await page.getByRole('button', { name: 'Search' }).click();
  } else {
    const hasGlobal = await page.getByLabel('Search measures').count();
    if (hasGlobal) {
      await page.getByLabel('Search measures').fill('education');
      await page.keyboard.press('Enter');
    }
  }
  const link = page.getByRole('link', { name: /Open summary/ }).first();
  await expect(link).toBeVisible();
  await link.click();
  await dismissTourIfPresent(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Summary' })).toBeVisible();
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




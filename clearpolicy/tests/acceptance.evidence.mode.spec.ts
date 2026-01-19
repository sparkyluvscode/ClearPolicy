import { test, expect } from '@playwright/test';
import { dismissTourIfPresent } from './helpers';

test.describe('Evidence Mode @acceptance', () => {
  test('Seeded measure shows badges and expandable evidence', async ({ page }) => {
    await page.goto('/measure/ca-prop-47-2014');
    await dismissTourIfPresent(page);
    const tldr = page.getByRole('heading', { name: 'TL;DR' }).locator('..').locator('p').first();
    await expect(tldr).toBeVisible();
    await expect(tldr).not.toHaveText('');

    const toggle = page.getByRole('button', { name: /Evidence Mode \(beta\)/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const tldrSection = page.getByRole('heading', { name: 'TL;DR' }).locator('..');
    await expect(tldrSection.getByText(/Supported\s+\d+\/\d+\s+claims/i)).toBeVisible();
    const claims = tldrSection.getByRole('list', { name: /TLDR claims with evidence/i });
    await expect(claims).toBeVisible();
    const firstClaim = claims.getByRole('listitem').first();
    await expect(firstClaim.getByTestId('evidence-badge')).toBeVisible();
    await firstClaim.getByRole('button', { name: /Show evidence|Why unverified/i }).click();
    await expect(firstClaim.getByText(/Source:|No supporting quote found/i)).toBeVisible();
  });

  test('Empty citations show all Unverified', async ({ page }) => {
    await page.goto('/dev/evidence-test?case=empty-citations');
    const toggle = page.getByRole('button', { name: /Evidence Mode \(beta\)/i });
    await toggle.click();
    await expect(page.getByText(/Supported\s+0\/\d+\s+claims/i)).toBeVisible();
    const claims = page.getByRole('list', { name: /TLDR claims with evidence/i });
    await expect(claims).toBeVisible();
    const items = claims.getByRole('listitem');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i).getByTestId('evidence-badge')).toHaveText(/Unverified/i);
    }
    await items.first().getByRole('button', { name: /Show evidence|Why unverified/i }).click();
    await expect(items.first().getByText(/No supporting quote found/i)).toBeVisible();
  });

  test('Weird formatting splits into sensible claims', async ({ page }) => {
    await page.goto('/dev/evidence-test?case=weird-format');
    const toggle = page.getByRole('button', { name: /Evidence Mode \(beta\)/i });
    await toggle.click();
    const claims = page.getByRole('list', { name: /TLDR claims with evidence/i });
    await expect(claims).toBeVisible();
    const items = claims.getByRole('listitem');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(2);
    expect(count).toBeLessThanOrEqual(6);
    for (let i = 0; i < count; i++) {
      const text = (await items.nth(i).innerText()).trim();
      expect(/[a-z0-9]/i.test(text)).toBeTruthy();
    }
  });

  test('No TLDR does not crash and shows safe message', async ({ page }) => {
    await page.goto('/dev/evidence-test?case=no-tldr');
    const toggle = page.getByRole('button', { name: /Evidence Mode \(beta\)/i });
    await toggle.click();
    await expect(page.getByTestId('evidence-metric')).toBeVisible();
    await expect(page.getByText(/No TL;DR available/i)).toBeVisible();
  });

  test('Claim splitting keeps single sentence intact', async ({ page }) => {
    await page.goto('/dev/evidence-test?case=one-sentence');
    await page.getByRole('button', { name: /Evidence Mode \(beta\)/i }).click();
    const claims = page.getByTestId('evidence-claims');
    await expect(claims).toBeVisible();
    const items = claims.getByTestId('evidence-claim');
    await expect(items).toHaveCount(1);
  });

  test('Claim splitting does not explode on comma-and', async ({ page }) => {
    await page.goto('/dev/evidence-test?case=comma-and');
    await page.getByRole('button', { name: /Evidence Mode \(beta\)/i }).click();
    const items = page.getByTestId('evidence-claim');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(3);
  });

  test('Evidence toggle does not leak across navigation', async ({ page }) => {
    await page.goto('/measure/ca-prop-47-2014');
    await dismissTourIfPresent(page);
    const toggle = page.getByTestId('evidence-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/measure/ca-prop-17-2020');
    await dismissTourIfPresent(page);
    const nextToggle = page.getByTestId('evidence-toggle');
    await expect(nextToggle).toHaveAttribute('aria-pressed', 'false');
  });
});

import { test, expect } from '@playwright/test';
import { dismissTourIfPresent } from './helpers';

test.describe('ZIP/Local lens @acceptance', () => {
  test('valid and invalid zip produce results or friendly errors', async ({ page }) => {
    await page.goto('/measure/ca-prop-17-2020');
    await dismissTourIfPresent(page);
    await expect(page.getByRole('heading', { name: 'Local lens' })).toBeVisible();
    const input = page.getByPlaceholder(/Enter ZIP/);
    // Invalid
    await input.fill('00000');
    await expect(input).toHaveValue('00000');
    await page.getByRole('button', { name: 'Look up' }).click();
    await expect(page.getByText(/ZIP code not found|Enter a 5-digit ZIP/)).toBeVisible();
    // Valid
    await input.fill('95014');
    await page.getByRole('button', { name: 'Look up' }).click();
    const zipPanel = page.getByRole('complementary', { name: /Local lens/ });
    const list = zipPanel.getByRole('list', { name: 'ZIP officials' });
    await expect(list).toBeVisible();
    await expect(list.locator('li').first()).toBeVisible();
  });
});



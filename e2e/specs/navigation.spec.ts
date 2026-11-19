import { expect, test } from '../fixtures';

test.describe('phone navigation', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('NAV-01 the More tab leads to everything without a tab of its own', async ({ page }) => {
    await page.goto('/sets');
    const tabs = page.getByRole('navigation', { name: 'Tabs' });
    await tabs.getByRole('link', { name: 'More' }).click();
    await expect(page).toHaveURL(/\/more$/);
    await expect(page.getByRole('heading', { name: 'More', level: 1 })).toBeVisible();
    await expect(tabs.getByRole('link', { name: 'More' })).toHaveAttribute('aria-current', 'page');
    for (const name of ['Collection', 'Import', 'Settings']) {
      await expect(page.getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings\/places$/);
  });

  test('NAV-02 a kid’s More tab holds only the theme and Sign out', async ({ kidPage }) => {
    await kidPage.setViewportSize({ width: 390, height: 800 });
    await kidPage.goto('/sets');
    const tabs = kidPage.getByRole('navigation', { name: 'Tabs' });
    await expect(tabs.getByRole('link')).toHaveText(['Library', 'Wishlist', 'More']);
    await tabs.getByRole('link', { name: 'More' }).click();
    await expect(kidPage).toHaveURL(/\/more$/);
    await expect(kidPage.getByRole('group', { name: 'Theme' })).toBeVisible();
    await expect(kidPage.getByRole('button', { name: 'Sign out' })).toBeVisible();
    for (const name of ['Collection', 'Import', 'Settings']) {
      await expect(kidPage.getByRole('link', { name })).toHaveCount(0);
    }
  });
});

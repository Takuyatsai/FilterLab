import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
    test('should toggle theme between dark and bright', async ({ page }) => {
        await page.goto('/');

        // Check initial theme state (default is dark)
        const html = page.locator('html');
        await expect(html).toHaveClass(/dark-mode/);

        // Click theme toggle button
        const toggleBtn = page.locator('.theme-toggle-btn');
        await toggleBtn.click();

        // Check if theme switched to bright
        await expect(html).toHaveClass(/bright-mode/);
        await expect(html).not.toHaveClass(/dark-mode/);

        // Click toggle button again
        await toggleBtn.click();

        // Check if theme switched back to dark
        await expect(html).toHaveClass(/dark-mode/);
        await expect(html).not.toHaveClass(/bright-mode/);
    });
});

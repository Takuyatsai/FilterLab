import { test, expect } from '@playwright/test';

test.describe('Image Analysis UI', () => {
    test('should display initial UI elements', async ({ page }) => {
        await page.goto('/');

        // Check headings
        await expect(page.locator('h1')).toContainText('Image Filter Lab');
        await expect(page.locator('h2').filter({ hasText: '參考照片' })).toBeVisible();
        await expect(page.locator('h2').filter({ hasText: '自己的原始照片' })).toBeVisible();

        // Check analyze button is disabled initially
        const analyzeBtn = page.locator('.primary-btn').filter({ hasText: '分析差異並產生建議' });
        await expect(analyzeBtn).toBeDisabled();

        // Check status text is empty initially
        const statusText = page.locator('.status-text');
        await expect(statusText).toBeEmpty();
    });

    test('should show placeholder text when no images are uploaded', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('text=選擇參考照片')).toBeVisible();
        await expect(page.locator('text=選擇自己的照片')).toBeVisible();
    });
});

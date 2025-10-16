// tests/responsive.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('devrait être responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Vérifier que la page s'affiche correctement
    await expect(page.getByRole('heading', { name: /PaintMini Academy/i })).toBeVisible();
  });

  test('devrait être responsive sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /PaintMini Academy/i })).toBeVisible();
  });

  test('devrait être responsive sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /PaintMini Academy/i })).toBeVisible();
  });
});
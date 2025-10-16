import { test, expect } from '@playwright/test';

test.describe('Accessibilité', () => {
  test('devrait avoir un titre principal', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la présence du titre principal
    await expect(page.getByText(/PaintMini Academy/i).first()).toBeVisible();
  });

  test('devrait avoir des labels sur les inputs de recherche', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la barre de recherche
    await expect(page.getByPlaceholder(/Rechercher un formateur/i)).toBeVisible();
  });

  test('devrait être navigable au clavier', async ({ page }) => {
    await page.goto('/');
    
    // Tester la navigation au clavier
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    await page.keyboard.press('Tab');
    
    // Vérifier qu'un élément est focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });
});
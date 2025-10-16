// tests/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('devrait naviguer entre les pages principales', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation vers messages
    await page.goto('/messages');
    await page.waitForTimeout(500);
    
    // Test navigation vers favoris
    await page.goto('/favorites');
    await page.waitForTimeout(500);
    
    // Test retour à l'accueil
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /PaintMini Academy/i })).toBeVisible();
  });

  test('devrait avoir un menu fonctionnel', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les boutons de navigation
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /S'inscrire/i })).toBeVisible();
  });
});

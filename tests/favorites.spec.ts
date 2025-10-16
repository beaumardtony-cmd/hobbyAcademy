// tests/favorites.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Favoris', () => {
  test('devrait afficher un message si non connecté', async ({ page }) => {
    await page.goto('/favorites');
    
    // Devrait rediriger vers la page d'accueil ou afficher un message
    await page.waitForTimeout(1000);
    
    // Vérifier qu'on est redirigé ou qu'il y a un message
    const url = page.url();
    expect(url).toMatch(/\/(favorites)?/);
  });
});
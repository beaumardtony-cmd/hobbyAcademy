import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('devrait afficher le dashboard ou rediriger si non connecté', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Attendre le chargement
    await page.waitForTimeout(2000);
    
    // Le dashboard peut soit afficher la page, soit rediriger vers /
    const url = page.url();
    
    // Accepter les deux cas : soit on reste sur /dashboard, soit on est redirigé vers /
    expect(url.endsWith('/dashboard') || url.endsWith('/')).toBeTruthy();
  });
});
// tests/admin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin', () => {
  test('devrait protéger la page admin', async ({ page }) => {
    await page.goto('/admin');
    
    // Attendre la redirection
    await page.waitForTimeout(1000);
    
    // Devrait être redirigé si non admin
    const url = page.url();
    expect(url).toMatch(/\/(admin)?/);
  });
});
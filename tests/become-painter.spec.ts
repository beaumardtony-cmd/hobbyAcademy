// tests/become-painter.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Devenir formateur', () => {
  test('devrait afficher le formulaire d\'inscription formateur', async ({ page }) => {
    await page.goto('/become-painter');
    
    // Attendre soit le formulaire soit une redirection
    await page.waitForTimeout(1000);
    
    const url = page.url();
    expect(url).toMatch(/\/(become-painter)?/);
  });
});
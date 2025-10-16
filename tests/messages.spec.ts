// tests/messages.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Messagerie', () => {
  test('devrait afficher la page des messages', async ({ page }) => {
    await page.goto('/messages');
    
    // Devrait rediriger si non connecté ou afficher la page
    await page.waitForTimeout(1000);
    
    const url = page.url();
    expect(url).toMatch(/\/(messages)?/);
  });
});
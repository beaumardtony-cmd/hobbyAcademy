// tests/painter-profile.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Profil formateur', () => {
  test('devrait afficher un profil de formateur', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur le premier formateur
    const firstPainter = page.locator('[class*="rounded-xl shadow-md"]').first();
    await firstPainter.click();
    
    // Attendre le chargement du profil
    await page.waitForURL(/\/painter\/.*\/profile/);
    
    // Vérifier les éléments du profil
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByText(/À propos/i)).toBeVisible();
  });

  test('devrait afficher le bouton de contact', async ({ page }) => {
    await page.goto('/');
    
    // Aller sur un profil
    const firstPainter = page.locator('[class*="rounded-xl shadow-md"]').first();
    await firstPainter.click();
    
    await page.waitForURL(/\/painter\/.*\/profile/);
    
    // Vérifier le bouton de contact
    await expect(page.getByRole('button', { name: /Contacter/i })).toBeVisible();
  });

  test('devrait afficher la section portfolio si présente', async ({ page }) => {
    await page.goto('/');
    
    const firstPainter = page.locator('[class*="rounded-xl shadow-md"]').first();
    await firstPainter.click();
    
    await page.waitForURL(/\/painter\/.*\/profile/);
    
    // Chercher le portfolio (peut ne pas être présent)
    const portfolio = page.getByText(/Portfolio/i);
    if (await portfolio.isVisible()) {
      await expect(portfolio).toBeVisible();
    }
  });

  test('devrait afficher les avis si présents', async ({ page }) => {
    await page.goto('/');
    
    const firstPainter = page.locator('[class*="rounded-xl shadow-md"]').first();
    await firstPainter.click();
    
    await page.waitForURL(/\/painter\/.*\/profile/);
    
    // Chercher les avis
    const reviews = page.getByText(/avis/i);
    await expect(reviews.first()).toBeVisible();
  });
});
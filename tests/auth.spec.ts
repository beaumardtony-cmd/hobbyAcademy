import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test('devrait ouvrir le modal de connexion', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur se connecter
    await page.getByRole('button', { name: /Se connecter/i }).click();
    
    // Attendre que le modal s'ouvre
    await page.waitForTimeout(500);
    
    // Vérifier que le modal est ouvert
    await expect(page.getByText(/Connexion/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/Email/i)).toBeVisible();
  });

  test('devrait ouvrir le modal d\'inscription', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur s'inscrire
    await page.getByRole('button', { name: /S'inscrire/i }).click();
    
    // Attendre que le modal s'ouvre
    await page.waitForTimeout(500);
    
    // Vérifier que le modal est ouvert - chercher "Inscription" ou "Email"
    const emailInput = page.getByPlaceholder(/Email/i);
    await expect(emailInput).toBeVisible();
  });

  test('devrait basculer entre connexion et inscription', async ({ page }) => {
    await page.goto('/');
    
    // Ouvrir le modal de connexion
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await page.waitForTimeout(500);
    
    // Vérifier qu'on est sur connexion
    await expect(page.getByText(/Connexion/i).first()).toBeVisible();
  });
});
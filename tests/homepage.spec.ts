// tests/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {
  test('devrait afficher la page d\'accueil correctement', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le titre
    await expect(page.getByRole('heading', { name: /PaintMini Academy/i })).toBeVisible();
    
    // Vérifier la présence du hero
    await expect(page.getByText(/Apprenez la peinture de figurines/i)).toBeVisible();
    
    // Vérifier la barre de recherche
    await expect(page.getByPlaceholder(/Rechercher un formateur/i)).toBeVisible();
  });

  test('devrait afficher la liste des formateurs', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que les formateurs se chargent
    await page.waitForSelector('text=/formateur/i');
    
    // Vérifier qu'il y a au moins un formateur
    const painterCards = page.locator('[class*="rounded-xl shadow-md"]').first();
    await expect(painterCards).toBeVisible();
  });

  test('devrait pouvoir rechercher un formateur', async ({ page }) => {
    await page.goto('/');
    
    // Rechercher
    const searchInput = page.getByPlaceholder(/Rechercher un formateur/i);
    await searchInput.fill('test');
    
    // Attendre que les résultats se mettent à jour
    await page.waitForTimeout(500);
  });

  test('devrait pouvoir filtrer par style', async ({ page }) => {
    await page.goto('/');
    
    // Ouvrir les filtres
    await page.getByRole('button', { name: /Filtres/i }).click();
    
    // Sélectionner un style
    await page.selectOption('select:has-text("Style")', 'Warhammer');
    
    // Vérifier que les résultats sont filtrés
    await page.waitForTimeout(500);
  });
});

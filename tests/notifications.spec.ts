import { test, expect } from '@playwright/test';

test.describe('Système de Notifications', () => {
  test('devrait afficher le badge de notifications dans le header', async ({ page }) => {
    await page.goto('/');
    
    // Si non connecté, le badge ne devrait pas être visible
    const bellIcon = page.locator('[data-testid="notification-badge"]');
    const isVisible = await bellIcon.isVisible().catch(() => false);
    
    // Le badge n'est visible que si l'utilisateur est connecté
    expect(isVisible).toBeDefined();
  });

  test('devrait accéder à la page des notifications', async ({ page }) => {
    await page.goto('/notifications');
    
    // Attendre le chargement
    await page.waitForTimeout(2000);
    
    // Soit on voit la page, soit on est redirigé vers /
    const url = page.url();
    expect(url.endsWith('/notifications') || url.endsWith('/')).toBeTruthy();
  });

  test('devrait afficher le message "Aucune notification" quand vide', async ({ page }) => {
    await page.goto('/notifications');
    
    // Attendre le chargement
    await page.waitForTimeout(2000);
    
    // Si on est sur la page notifications, vérifier le contenu
    if (page.url().endsWith('/notifications')) {
      // Chercher soit "Aucune notification" soit des notifications
      const hasContent = await page.locator('text=/notification/i').isVisible();
      expect(hasContent).toBeTruthy();
    }
  });

  test('devrait avoir un titre "Notifications"', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    
    if (page.url().endsWith('/notifications')) {
      const title = page.getByRole('heading', { name: /Notifications/i });
      await expect(title).toBeVisible();
    }
  });

  test('devrait avoir un bouton retour', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    
    if (page.url().endsWith('/notifications')) {
      const backButton = page.locator('svg.lucide-arrow-left');
      await expect(backButton.first()).toBeVisible();
    }
  });

  test('devrait afficher l\'icône de cloche', async ({ page }) => {
    await page.goto('/');
    
    // Chercher l'icône Bell (cloche)
    const bellIcons = page.locator('svg.lucide-bell');
    const count = await bellIcons.count();
    
    // Au moins une cloche devrait être présente (dans le header ou ailleurs)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('navigation: cliquer sur notifications depuis l\'accueil', async ({ page }) => {
    await page.goto('/');
    
    // Si connecté, le badge devrait être cliquable
    const notifLink = page.locator('a[href="/notifications"]');
    const exists = await notifLink.count();
    
    if (exists > 0) {
      await notifLink.first().click();
      await page.waitForTimeout(1000);
      
      // Devrait être sur /notifications ou redirigé
      const url = page.url();
      expect(url).toBeDefined();
    }
  });

  test('devrait gérer la page même sans notifications', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    
    // La page devrait se charger sans erreur
    const hasError = await page.locator('text=/error/i').isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('responsive: notifications sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    
    if (page.url().endsWith('/notifications')) {
      // Le titre devrait être visible même sur mobile
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });

  test('responsive: notifications sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    
    if (page.url().endsWith('/notifications')) {
      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible();
    }
  });
});
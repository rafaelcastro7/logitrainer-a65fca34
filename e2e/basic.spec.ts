import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Skip onboarding tour via localStorage
  await page.addInitScript(() => {
    window.localStorage.setItem('logitrainer-onboarded', 'true');
  });
});

test('has title and loads dashboard', async ({ page }) => {
  await page.goto('/');

  // Wait for loader to disappear
  await page.getByText(/Loading workspace/i).waitFor({ state: 'detached', timeout: 30000 });

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/LogiTrainer/);

  // Check if LogiTrainer Studio text is present (using first to avoid multiple matches error)
  await expect(page.getByText('LogiTrainer Studio').first()).toBeVisible();

  // Check if Dashboard tab is active or visible
  await expect(page.getByText(/Dashboard|Panel/i).first()).toBeVisible();
});

test('navigation to editor', async ({ page }) => {
  await page.goto('/');
  
  // Wait for loader to disappear
  await page.getByText(/Loading workspace/i).waitFor({ state: 'detached', timeout: 30000 });

  // Click on Editor tab (it should be in the sidebar)
  const editorTab = page.getByRole('button', { name: /Editor/i });
  await editorTab.click();

  // Verify we are in the editor view (the heading says Timeline or Línea de Tiempo)
  await expect(page.getByText(/Timeline|Línea de Tiempo/i).first()).toBeVisible();
});





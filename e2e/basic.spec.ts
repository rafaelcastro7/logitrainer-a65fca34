import { test, expect } from '@playwright/test';

test('has title and loads dashboard', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/LogiTrainer/);

  // Check if LogiTrainer Studio text is present
  await expect(page.getByText('LogiTrainer Studio')).toBeVisible();

  // The onboarding tour might appear, let's try to skip it if it does
  const skipButton = page.getByRole('button', { name: /Skip|Saltar/i });
  if (await skipButton.isVisible()) {
    await skipButton.click();
  }

  // Check if Dashboard tab is active or visible
  await expect(page.getByText(/Dashboard|Panel/i)).toBeVisible();
});

test('navigation to editor', async ({ page }) => {
  await page.goto('/');
  
  // Skip onboarding
  const skipButton = page.getByRole('button', { name: /Skip|Saltar/i });
  if (await skipButton.isVisible()) {
    await skipButton.click();
  }

  // Click on Editor tab (it should be in the sidebar)
  const editorTab = page.getByRole('button', { name: /Editor/i });
  await editorTab.click();

  // Verify we are in the editor view
  await expect(page.getByText(/Video Editor|Escenas/i)).toBeVisible();
});

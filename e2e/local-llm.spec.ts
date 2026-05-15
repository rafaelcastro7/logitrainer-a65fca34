import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Skip onboarding tour via localStorage
  await page.addInitScript(() => {
    window.localStorage.setItem('logitrainer-onboarded', 'true');
  });
});

test('can see local ollama in api management', async ({ page }) => {
  await page.goto('/');

  // Wait for loader to disappear
  await page.getByText(/Loading workspace/i).waitFor({ state: 'detached', timeout: 30000 });

  // 1. Go to APIs tab
  await page.getByRole('button', { name: /APIs/i }).click();

  // 2. Find Local Ollama
  await page.getByText('Local Ollama').click();
  
  // 3. Verify models are listed
  await expect(page.getByText('Llama 3 (Local)')).toBeVisible();
  await expect(page.getByText('Mistral (Local)')).toBeVisible();
  await expect(page.getByText('Phi-3 (Local)')).toBeVisible();

  // 4. Verify description
  await expect(page.getByText(/Ejecuta modelos como Llama 3/i)).toBeVisible();
});

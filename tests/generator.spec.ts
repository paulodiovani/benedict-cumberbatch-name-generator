import { test, expect } from '@playwright/test';

test('renders the first generated name on load', async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __webLlmCheckWebGPU?: () => Promise<boolean>; __webLlmEngine?: unknown }).__webLlmCheckWebGPU = async () => true;
    (window as Window & { __webLlmCheckWebGPU?: () => Promise<boolean>; __webLlmEngine?: unknown }).__webLlmEngine = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: JSON.stringify({ firstName: 'Bumblesnatch', lastName: 'Cuddlefish', funFact: 'Once mistook a hedgehog for a minor aristocrat.' }) } }],
          }),
        },
      },
    };
  });

  await page.goto('/');
  await expect(page.locator('.card-name__first')).toHaveText('Bumblesnatch', { timeout: 15000 });
  await expect(page.locator('.card-name__last')).toHaveText('Cuddlefish');
  await expect(page.locator('.card-name__fun-fact')).toHaveText('"Once mistook a hedgehog for a minor aristocrat."');
  await expect(page.locator('#history-section')).toBeHidden();
});

test('clicking Generate pushes the previous name into history', async ({ page }) => {
  await page.addInitScript(() => {
    const names = [
      { firstName: 'Bumblesnatch', lastName: 'Cuddlefish', funFact: 'Once mistook a hedgehog for a minor aristocrat.' },
      { firstName: 'Wafflebart', lastName: 'Pondsworth', funFact: 'Believes weather is a personal attack.' },
    ];
    let count = 0;
    (window as Window & { __webLlmCheckWebGPU?: () => Promise<boolean>; __webLlmEngine?: unknown }).__webLlmCheckWebGPU = async () => true;
    (window as Window & { __webLlmCheckWebGPU?: () => Promise<boolean>; __webLlmEngine?: unknown }).__webLlmEngine = {
      chat: {
        completions: {
          create: async () => ({ choices: [{ message: { content: JSON.stringify(names[count++ % 2]) } }] }),
        },
      },
    };
  });

  await page.goto('/');
  await expect(page.locator('.card-name__first')).toHaveText('Bumblesnatch', { timeout: 15000 });

  await page.locator('#generate-button').click();
  await expect(page.locator('.card-name__first')).toHaveText('Wafflebart');

  const historyItem = page.locator('.history-item').first();
  await expect(historyItem).toBeVisible();
  await expect(historyItem.locator('.history-item__first')).toHaveText('Bumblesnatch');
  await expect(historyItem.locator('.history-item__last')).toHaveText('Cuddlefish');
});

test('shows the error banner when WebGPU is not available', async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __webLlmCheckWebGPU?: () => Promise<boolean>; __webLlmEngine?: unknown }).__webLlmCheckWebGPU = async () => false;
  });

  await page.goto('/');
  await expect(page.locator('.card-error__message')).toContainText('WebGPU is not available');
});
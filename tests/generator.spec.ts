import { test, expect, type Route } from '@playwright/test';
import type { GeneratedName } from '../src/types';

function mockResponse(name: GeneratedName) {
  return (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: JSON.stringify(name) } }],
      }),
    });
}

test('renders the first generated name on load', async ({ page }) => {
  const name: GeneratedName = {
    firstName: 'Bumblesnatch',
    lastName: 'Cuddlefish',
    funFact: 'Once mistook a hedgehog for a minor aristocrat.',
  };
  await page.route('**/v1/chat/completions', mockResponse(name));

  await page.goto('/');

  await expect(page.locator('.card-name__first')).toHaveText(name.firstName);
  await expect(page.locator('.card-name__last')).toHaveText(name.lastName);
  await expect(page.locator('.card-name__fun-fact')).toHaveText(`"${name.funFact}"`);
  await expect(page.locator('#history-section')).toBeHidden();
});

test('clicking Generate pushes the previous name into history', async ({ page }) => {
  const first: GeneratedName = {
    firstName: 'Wafflebart',
    lastName: 'Pondsworth',
    funFact: 'Believes weather is a personal attack.',
  };
  const second: GeneratedName = {
    firstName: 'Crumplewick',
    lastName: 'Bogshank',
    funFact: 'Invented a soup that defeated a duke.',
  };

  const responses: GeneratedName[] = [first, second];
  await page.route('**/v1/chat/completions', (route) => {
    const next = responses.shift() ?? second;
    return mockResponse(next)(route);
  });

  await page.goto('/');
  await expect(page.locator('.card-name__first')).toHaveText(first.firstName);

  await page.locator('#generate-button').click();
  await expect(page.locator('.card-name__first')).toHaveText(second.firstName);

  const historyItem = page.locator('.history-item').first();
  await expect(historyItem).toBeVisible();
  await expect(historyItem.locator('.history-item__first')).toHaveText(first.firstName);
  await expect(historyItem.locator('.history-item__last')).toHaveText(first.lastName);
});

test('shows the error banner when the LLM call fails', async ({ page }) => {
  await page.route('**/v1/chat/completions', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
  );

  await page.goto('/');

  await expect(page.locator('.card-error__message')).toHaveText(
    'The name generation machine has temporarily jammed. Try again.',
  );
});

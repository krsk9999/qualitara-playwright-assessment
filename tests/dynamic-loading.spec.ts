import { expect, test } from '@playwright/test';
import { DynamicLoadingPage } from '../pages/dynamic-loading.page';

// The page reveals #finish from a client-side setTimeout(…, 5000) started by the Start click
// (measured 5.38–5.42s from click to visible). The project-wide expect timeout in
// playwright.config.ts comfortably covers that, so no per-assertion override is needed.

test.describe('Dynamic loading: hidden element', () => {
  test('reveals "Hello World!" after loading completes', async ({ page }) => {
    const dynamicLoadingPage = new DynamicLoadingPage(page);

    await test.step('Open the dynamic loading index page', async () => {
      await dynamicLoadingPage.goto();
    });

    await test.step('Open "Example 1: Element on page that is hidden"', async () => {
      await expect(dynamicLoadingPage.$example1Link).toBeVisible();
      await dynamicLoadingPage.openExample1();
      await expect(page).toHaveURL('/dynamic_loading/1');
    });

    await test.step('Verify the initial state', async () => {
      await expect(dynamicLoadingPage.$startButton).toBeVisible();
      // In the DOM but display:none: toBeHidden, not an attachment check.
      await expect(dynamicLoadingPage.$finishText).toBeHidden();
    });

    await test.step('Start loading', async () => {
      await dynamicLoadingPage.start();
      // Proves the click handler ran (it injects the indicator), so a failure fails here,
      // quickly and with a clear cause, instead of as a slow timeout on the finish text.
      await expect(dynamicLoadingPage.$loadingIndicator).toBeVisible();
    });

    await test.step('Verify the finish text is revealed', async () => {
      await expect(dynamicLoadingPage.$finishText).toBeVisible();
      await expect(dynamicLoadingPage.$finishText).toHaveText('Hello World!');
      await expect(dynamicLoadingPage.$loadingIndicator).toBeHidden();
    });
  });
});

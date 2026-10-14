import { expect, test } from '@playwright/test';
import { CheckboxesPage } from '../pages/checkboxes.page';

test.describe('Checkboxes', () => {
  let checkboxesPage: CheckboxesPage;

  test.beforeEach(async ({ page }) => {
    checkboxesPage = new CheckboxesPage(page);

    await test.step('Open the page and verify the initial state', async () => {
      await checkboxesPage.goto();
      await expect(checkboxesPage.$checkboxes).toHaveCount(2);
      await expect(checkboxesPage.$firstCheckbox).not.toBeChecked();
      await expect(checkboxesPage.$secondCheckbox).toBeChecked();
    });
  });

  test('check() and uncheck() set the requested state', async () => {
    await test.step('Check the first checkbox', async () => {
      await checkboxesPage.$firstCheckbox.check();
      await expect(checkboxesPage.$firstCheckbox).toBeChecked();
    });

    await test.step('Uncheck the second checkbox', async () => {
      await checkboxesPage.$secondCheckbox.uncheck();
      await expect(checkboxesPage.$secondCheckbox).not.toBeChecked();
    });
  });

  test('click() toggles each checkbox in both directions', async () => {
    await test.step('Click both checkboxes to invert them', async () => {
      await checkboxesPage.$firstCheckbox.click();
      await checkboxesPage.$secondCheckbox.click();
      await expect(checkboxesPage.$firstCheckbox).toBeChecked();
      await expect(checkboxesPage.$secondCheckbox).not.toBeChecked();
    });

    await test.step('Click both again to restore the initial state', async () => {
      await checkboxesPage.$firstCheckbox.click();
      await checkboxesPage.$secondCheckbox.click();
      await expect(checkboxesPage.$firstCheckbox).not.toBeChecked();
      await expect(checkboxesPage.$secondCheckbox).toBeChecked();
    });
  });
});

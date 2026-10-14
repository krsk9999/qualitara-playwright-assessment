import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { SecureAreaPage } from '../pages/secure-area.page';
import { loginCases } from '../test-data/login.data';

test.describe('Login', () => {
  for (const data of loginCases) {
    test(data.title, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const secureAreaPage = new SecureAreaPage(page);

      await test.step('Open the login page', async () => {
        await loginPage.goto();
        await expect(loginPage.$usernameInput).toBeVisible();
      });

      await test.step(`Log in as "${data.username}"`, async () => {
        await loginPage.login(data.username, data.password);
      });

      // The banner text is "<message>\n×" (the × is a close link inside the banner), so an
      // exact toHaveText would fail. toContainText checks the meaningful part literally, with
      // whitespace normalised, and doesn't tie the test to the markup the way an anchored
      // regex would. The banner only renders after the redirect, so asserting it first also
      // guarantees the URL checks below run after navigation has settled.
      if (data.expected === 'success') {
        await test.step('Verify the secure area is shown', async () => {
          await expect(secureAreaPage.$flash).toContainText(data.flashMessage);
          await expect(page).toHaveURL('/secure');
          await expect(secureAreaPage.$logoutLink).toBeVisible();
        });
      } else {
        await test.step('Verify the user stays on the login form', async () => {
          await expect(loginPage.$flash).toContainText(data.flashMessage);
          await expect(page).toHaveURL('/login');
          await expect(loginPage.$usernameInput).toBeVisible();
          await expect(loginPage.$passwordInput).toBeVisible();
          await expect(loginPage.$loginButton).toBeVisible();
        });
      }
    });
  }
});

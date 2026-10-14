import type { Locator, Page } from '@playwright/test';

/** Secure area at /secure, reached after a successful login. */
export class SecureAreaPage {
  readonly $logoutLink: Locator;
  /** Server-rendered flash banner carried over from the login redirect. */
  readonly $flash: Locator;

  constructor(page: Page) {
    this.$logoutLink = page.getByRole('link', { name: 'Logout' });
    this.$flash = page.locator('#flash');
  }
}

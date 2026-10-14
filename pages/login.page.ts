import type { Locator, Page } from '@playwright/test';

/** Login form at /login. */
export class LoginPage {
  readonly $usernameInput: Locator;
  readonly $passwordInput: Locator;
  readonly $loginButton: Locator;
  /** Server-rendered flash banner; only present after a login attempt. */
  readonly $flash: Locator;

  constructor(private readonly page: Page) {
    this.$usernameInput = page.getByLabel('Username');
    this.$passwordInput = page.getByLabel('Password');
    this.$loginButton = page.getByRole('button', { name: 'Login' });
    // No role or accessible name on the banner, so an id is the most stable hook.
    this.$flash = page.locator('#flash');
  }

  /** Opens the login page. */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /** Fills both credentials and submits the form. */
  async login(username: string, password: string): Promise<void> {
    await this.$usernameInput.fill(username);
    await this.$passwordInput.fill(password);
    await this.$loginButton.click();
  }
}

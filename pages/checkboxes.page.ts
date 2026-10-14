import type { Locator, Page } from '@playwright/test';

/** Two unlabelled checkboxes at /checkboxes. */
export class CheckboxesPage {
  readonly $checkboxes: Locator;
  readonly $firstCheckbox: Locator;
  readonly $secondCheckbox: Locator;

  constructor(private readonly page: Page) {
    // The inputs have no accessible name, so position within the form is their identity.
    this.$checkboxes = page.locator('form#checkboxes').getByRole('checkbox');
    this.$firstCheckbox = this.$checkboxes.nth(0);
    this.$secondCheckbox = this.$checkboxes.nth(1);
  }

  /** Opens the checkboxes page. */
  async goto(): Promise<void> {
    await this.page.goto('/checkboxes');
  }
}

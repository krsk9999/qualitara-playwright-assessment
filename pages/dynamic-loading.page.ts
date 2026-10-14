import type { Locator, Page } from '@playwright/test';

/** "Element on page that is hidden" example at /dynamic_loading/1. */
export class DynamicLoadingPage {
  readonly $startButton: Locator;
  /** Injected into the DOM by the Start click handler; absent before it. */
  readonly $loadingIndicator: Locator;
  /** Always in the DOM, rendered with display:none until loading completes. */
  readonly $finishText: Locator;

  constructor(private readonly page: Page) {
    this.$startButton = page.getByRole('button', { name: 'Start' });
    // Neither element has a role or label. getByText would match the very text the
    // test asserts on, so the ids are the honest identity here.
    this.$loadingIndicator = page.locator('#loading');
    this.$finishText = page.locator('#finish');
  }

  /** Opens example 1. */
  async goto(): Promise<void> {
    await this.page.goto('/dynamic_loading/1');
  }

  /** Clicks Start to begin loading. */
  async start(): Promise<void> {
    await this.$startButton.click();
  }
}

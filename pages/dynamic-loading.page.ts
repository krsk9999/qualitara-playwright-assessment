import type { Locator, Page } from '@playwright/test';

/**
 * Dynamic loading examples: the index at /dynamic_loading and
 * example 1 ("Element on page that is hidden") at /dynamic_loading/1.
 */
export class DynamicLoadingPage {
  /** Link on the index page that opens example 1. */
  readonly $example1Link: Locator;
  readonly $startButton: Locator;
  /** Injected into the DOM by the Start click handler; absent before it. */
  readonly $loadingIndicator: Locator;
  /** Always in the DOM, rendered with display:none until loading completes. */
  readonly $finishText: Locator;

  constructor(private readonly page: Page) {
    this.$example1Link = page.getByRole('link', {
      name: 'Example 1: Element on page that is hidden',
    });
    this.$startButton = page.getByRole('button', { name: 'Start' });
    // Neither element has a role or label. getByText would match the very text the
    // test asserts on, so the ids are the honest identity here.
    this.$loadingIndicator = page.locator('#loading');
    this.$finishText = page.locator('#finish');
  }

  /** Opens the dynamic loading index page. */
  async goto(): Promise<void> {
    await this.page.goto('/dynamic_loading');
  }

  /** Opens example 1 from the index page. */
  async openExample1(): Promise<void> {
    await this.$example1Link.click();
  }

  /** Clicks Start to begin loading. */
  async start(): Promise<void> {
    await this.$startButton.click();
  }
}

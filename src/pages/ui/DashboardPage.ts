import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage{
  readonly heading = this.page.getByRole('heading', { name: 'Dashboard' });
  readonly pimLink = this.page.getByRole('link', { name: 'PIM' });

  constructor( page: Page ) {
      super(page);
  }

  async expectLoaded(): Promise<void> {
      await expect(this.page).toHaveURL(/dashboard\/index/);
      await expect(this.heading).toBeVisible();
      await this.runAccessibilityTest();
      await expect(this.pimLink).toBeEnabled();
      await this.pimLink.click();
  }
}

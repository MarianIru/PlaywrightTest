import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage{
  readonly heading = this.page.getByRole('heading', { name: 'Dashboard' });
  readonly dashboardLink = this.page.getByRole('link', { name: 'Dashboard' });
  readonly pimLink = this.page.getByRole('link', { name: 'PIM' });

  constructor( page: Page ) {
      super(page);
  }

  async openDashboard(): Promise<void> {
      await expect(this.dashboardLink).toBeEnabled();
      await this.dashboardLink.click();
  }

  async expectLoaded(): Promise<void> {
      await expect(this.page).toHaveURL(/dashboard\/index/);
      await expect(this.heading).toBeVisible();
      await this.runAccessibilityTest();
  }

    async openPim(): Promise<void> {
        await expect(this.pimLink).toBeEnabled();
        await this.pimLink.click();
        await expect(this.page).toHaveURL(/pim\/viewEmployeeList/);
        await this.runAccessibilityTest();
    }
}

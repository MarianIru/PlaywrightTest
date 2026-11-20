import { test as base, expect } from "@playwright/test";
import { PimPage } from "../pages/ui/PimPage";
import { LoginPage } from "../pages/ui/LoginPage";
import { DashboardPage } from "../pages/ui/DashboardPage";
import { AdminPage } from "../pages/ui/AdminPage";

export interface UiFixtures {
  pimPage: PimPage;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  adminPage: AdminPage;
}

export const test = base.extend<UiFixtures>({
  pimPage: async ({ page }, use) => {
    await use(new PimPage(page));
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },
});

export { expect };

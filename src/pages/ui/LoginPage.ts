import { Locator, Page, expect } from '@playwright/test';

/** Page Object for the OrangeHRM login screen. Locators are user-facing (placeholder/role/text), not CSS paths. */
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly invalidCredentialsMessage: Locator;
  readonly requiredFieldMessages: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.invalidCredentialsMessage = page.getByText('Invalid credentials');
    this.requiredFieldMessages = page.getByText('Required', { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('web/index.php/auth/login');
    await expect(this.loginButton).toBeVisible(); // auto-waits: the demo site is slow to render
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

    async expectLoggedIn(): Promise<void> {
        await expect(this.page).not.toHaveURL(/auth\/login/);
        await expect(this.page.locator('.oxd-userdropdown-tab')).toBeVisible();
    }

  async invalidLoginCheck() {
      await expect(this.invalidCredentialsMessage).toBeVisible();
      await expect(this.page).toHaveURL(/auth\/login/);
  }

  async logout(): Promise<void> {
      await this.page.locator('.oxd-userdropdown-tab').click();
      await this.page.getByRole('menuitem', { name: 'Logout' }).click();
      await expect(this.page).toHaveURL(/auth\/login/);
  }
}

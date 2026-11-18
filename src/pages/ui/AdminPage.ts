import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import userInfo from "../../data/userData.json";

export interface UserFormData {
    role?: string;
    employeeName?: string;
    status?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
}

export class AdminPage extends BasePage {
    readonly adminHeading = this.page.getByRole('heading', { name: 'Admin' });
    readonly adminLink = this.page.getByRole('link', { name: 'Admin' });
    readonly addUserButtonLocator = this.page.getByRole('button', { name: 'Add' });
    readonly addUserHeading = this.page.getByRole('heading', { name: 'Add User' });
    readonly employeeNameInput = this.page.locator('.oxd-input-group', { hasText: 'Employee Name' })
        .getByPlaceholder('Type for hints...');
    readonly usernameInput = this.fieldInput('Username');
    readonly passwordInput = this.fieldInput('Password');
    readonly confirmPasswordInput = this.fieldInput('Confirm Password');

    constructor( page: Page) {
        super(page);
    }

    async viewAdminPage(): Promise<void> {
        await expect(this.adminLink).toBeEnabled();
        await this.adminLink.click();

        await expect(this.page).toHaveURL(/admin\/viewSystemUsers/);
        await expect(this.adminHeading).toBeVisible();
        await this.runAccessibilityTest();
    }

    async openAddUserForm(): Promise<void> {
        await expect(this.addUserButtonLocator).toBeEnabled();
        await this.addUserButtonLocator.click();

        await expect(this.addUserHeading).toBeVisible();
        await this.runAccessibilityTest();
    }

    async fillUserForm(data: UserFormData): Promise<void> {
        if (data.role) await this.selectDropdownOption('User Role', data.role);
        if (data.employeeName) {
            await this.employeeNameInput.fill(data.employeeName);
            await this.page.getByRole('option', { name: data.employeeName }).click();
        }
        if (data.status) await this.selectDropdownOption('Status', data.status);
        if (data.username !== undefined) await this.usernameInput.fill(data.username);
        if (data.password !== undefined) await this.passwordInput.fill(data.password);
        if (data.confirmPassword !== undefined) await this.confirmPasswordInput.fill(data.confirmPassword);
    }

    async addUserRole(empName: string, username: string, password: string): Promise<void> {
        await expect(this.addUserHeading).toBeVisible();
        await this.fillUserForm({
            role: userInfo.employeeRole,
            employeeName: empName,
            status: userInfo.userStatusEnabled,
            username,
            password,
            confirmPassword: password,
        });
        await this.saveDetails(userInfo.saveButton);
        await this.runAccessibilityTest();
    }

    async submitUserForm(): Promise<void> {
        await this.saveDetails(userInfo.saveButton);
        await this.runAccessibilityTest();
    }

    async expectStillOnAddUserForm(): Promise<void> {
        await expect(this.addUserHeading).toBeVisible();
    }

   async resetAddUserForm(): Promise<void> {
        await this.page.reload();
        await expect(this.addUserHeading).toBeVisible();
    }
}

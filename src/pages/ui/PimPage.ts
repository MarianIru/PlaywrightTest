import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PimPage extends BasePage {
    readonly addEmployeeHeading = this.page.getByRole('heading', { name: 'PIM' });
    readonly firstNameInput = this.page.getByPlaceholder('First Name');
    readonly lastNameInput = this.page.getByPlaceholder('Last Name');
    readonly employeeIdInput = this.fieldInput('Employee Id');
    readonly createLoginSwitch = this.page.locator('.oxd-switch-input');
    readonly usernameInput = this.fieldInput('Username');
    readonly passwordInput = this.fieldInput('Password');
    readonly confirmPasswordInput = this.fieldInput('Confirm Password');

    constructor(page: Page) {
        super(page);
    }

    async openAddEmployeeForm(): Promise<void> {
        await this.page.goto('web/index.php/pim/addEmployee');
        await expect(this.addEmployeeHeading).toBeVisible();
        await this.runAccessibilityTest();
    }

    async fillEmployeeDetails(): Promise<string> {
        const firstName = this.generateName('Test');
        const lastName = this.generateName('Emp');
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.employeeIdInput.fill(this.generateEmployeeId());
        return `${firstName} ${lastName}`;
    }

    async enableLoginDetails(): Promise<void> {
        await this.createLoginSwitch.click();
        await expect(this.usernameInput).toBeVisible();
    }

    async fillLoginDetails(d: { username?: string; password?: string; confirmPassword?: string }): Promise<void> {
        if (d.username !== undefined) await this.usernameInput.fill(d.username);
        if (d.password !== undefined) await this.passwordInput.fill(d.password);
        if (d.confirmPassword !== undefined) await this.confirmPasswordInput.fill(d.confirmPassword);
    }

    async expectStillOnAddEmployee(): Promise<void> {
        await expect(this.page).toHaveURL(/pim\/addEmployee/);   // not redirected, so nothing was saved
    }

    async submitEmployeeForm(): Promise<void> {
        await this.saveDetails('Save');
        await this.runAccessibilityTest();
    }

    async resetAddEmployeeForm(): Promise<void> {
        await this.page.reload();
        await expect(this.addEmployeeHeading).toBeVisible();
    }

    /** Creates an employee with a unique name and returns the full name for use in Add User. */
    async addEmployee(login?: { username: string; password: string }): Promise<string> {
        await this.openAddEmployeeForm();
        const fullName = await this.fillEmployeeDetails();
        if (login) {
            await this.enableLoginDetails();
            await this.fillLoginDetails({ ...login, confirmPassword: login.password });
        }
        await this.saveDetails('Save');
        await expect(this.page).toHaveURL(/pim\/viewPersonalDetails/);
        return fullName;
    }
}

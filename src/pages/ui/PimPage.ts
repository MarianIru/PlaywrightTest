import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PimPage extends BasePage {
    readonly addEmployeeHeading = this.page.getByRole('heading', { name: 'PIM' });
    readonly firstNameInput = this.page.getByPlaceholder('First Name');
    readonly lastNameInput = this.page.getByPlaceholder('Last Name');
    readonly employeeIdInput = this.fieldInput('Employee Id');

    constructor(page: Page) {
        super(page);
    }

    /** Creates an employee with a unique name and returns the full name for use in Add User. */
    async addEmployee(): Promise<string> {
        const firstName = this.generateName('Test');
        const lastName = this.generateName('Emp');

        await this.page.goto('web/index.php/pim/addEmployee');
        await expect(this.addEmployeeHeading).toBeVisible();
        await this.runAccessibilityTest();
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.employeeIdInput.fill(this.generateEmployeeId());
        await this.saveDetails('Save');

        // Wait for the save to finish: the app redirects to the employee's personal details page
        await expect(this.page).toHaveURL(/pim\/viewPersonalDetails/);

       return `${firstName} ${lastName}`;
    }
}

import { expect, type Page } from '@playwright/test';
import { AxeUtils } from '../../utils/AxeUtils'
import userInfo from "../../data/userData.json";
import {testConfig} from "../../config";

export class BasePage {
    public readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    generateName(prefix: string): string {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const suffix = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
        return `${prefix}${suffix}`;
    }

    generateUsername(): string {
            return `${userInfo.usernamePrefix}${Date.now()}`;
    }

    generatePassword(): string {
        const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const length = 10;
        return Array.from(
            { length },
            () => letters[Math.floor(Math.random() * letters.length)]
        ).join('');
    }

    generateEmployeeId(): string {
        const time = String(Date.now()).slice(-7);                    // last 7 digits of the timestamp
        const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        return `${time}${rand}`;                                      // 10 digits
    }

    async saveDetails(buttonText: string) {
        const locator = this.page.getByRole('button', { name: buttonText });
        await expect(locator).toBeEnabled();
        await locator.click();
    }

    async selectDropdownOption(label: string, optionText: string): Promise<void> {
        const dropdown = this.page
            .locator('.oxd-input-group', { hasText: label })
            .locator('.oxd-select-text');

        await expect(dropdown).toBeVisible();
        await dropdown.click();
        await this.page.getByRole('option', { name: optionText, exact: true }).click();
        await expect(dropdown).toHaveText(optionText);
    }

    protected fieldInput(label: string) {
        return this.page
            .locator('.oxd-input-group')
            .filter({ has: this.page.getByText(label, { exact: true }) })
            .locator('input');
    }

    // To check for any error message in the UI
    protected fieldError(label: string) {
        return this.page
            .locator('.oxd-input-group')
            .filter({ has: this.page.getByText(label, { exact: true }) })
            .locator('.oxd-input-field-error-message');
    }

    async runAccessibilityTest() {
        if (testConfig.runAccessibilityTest) {
            await new AxeUtils(this.page).audit();
        }
    }

    async logInfo(scenarioName: string, log: string) {
        let ret = scenarioName;
        if (log) {
            ret = ret + " : " + log;
        }
        console.info(ret);
    }
}

import AxeBuilder from '@axe-core/playwright';
import { Page, test, expect } from '@playwright/test';

export class AxeUtils {
    constructor(private readonly page: Page) {}

    /** Scans the current page, attaches the full result to the report, and fails softly on violations. */
    async audit(scenario = 'Accessibility scan'): Promise<void> {
        const results = await new AxeBuilder({ page: this.page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        await test.info().attach(`${scenario} (axe results)`, {
            body: JSON.stringify(results.violations, null, 2),
            contentType: 'application/json',
        });

        const summary = results.violations.map(
            (v) => `${v.id} [${v.impact}] on ${v.nodes.length} element(s)`
        );
        console.info(`${scenario}: ${summary.length} violation(s)`, summary);

        expect.soft(results.violations, `${scenario}: accessibility violations`).toEqual([]);
    }
}

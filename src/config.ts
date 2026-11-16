import 'dotenv/config';

export const testConfig = {
    petstoreBaseUrl: process.env.PETSTORE_BASE_URL ?? 'https://petstore.swagger.io/v2/',
    orangeHrmBaseUrl: process.env.ORANGEHRM_BASE_URL ?? 'https://opensource-demo.orangehrmlive.com/',
    crossBrowser: process.env.CROSS_BROWSER === 'true',
    username: process.env.ORANGEHRM_USERNAME || 'Admin',
    password: process.env.ORANGEHRM_PASSWORD || 'admin123',
    runAccessibilityTest: process.env.RUN_A11Y === 'false',
    browser: (process.env.BROWSER ?? 'chromium') as 'chromium' | 'firefox' | 'webkit',
    showBrowser: process.env.SHOW_BROWSER === 'true'
};

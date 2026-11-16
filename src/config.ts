import 'dotenv/config';

export const testConfig = {
    petstoreBaseUrl: process.env.PETSTORE_BASE_URL ?? 'https://petstore.swagger.io/v2/',
    orangeHrmBaseUrl: process.env.ORANGEHRM_BASE_URL ?? 'https://opensource-demo.orangehrmlive.com/',
    crossBrowser: process.env.CROSS_BROWSER === 'true',
    username: process.env.ORANGEHRM_USERNAME || '',
    password: process.env.ORANGEHRM_PASSWORD || '',
    runAccessibilityTest: false,
    browser: (process.env.BROWSER ?? 'chromium') as 'chromium' | 'firefox' | 'webkit'
};

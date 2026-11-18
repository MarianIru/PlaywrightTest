import { test } from '../../fixtures/uiFixtures';
import { testConfig } from '../../config';

test.describe('OrangeHRM UI: Add User', () => {
  const scenario = 'Admin - Add User';

  test('admin creates an employee and a user who can then log in @smoke', async ({
    pimPage,
    loginPage,
    dashboardPage,
    adminPage,
  }) => {
    const generatedUsername: string = adminPage.generateUsername();
    const newGeneratedUsername: string = adminPage.generateUsername();
    const generatedPassword: string = adminPage.generatePassword();

    await adminPage.logInfo(scenario, 'Login as admin');
    await loginPage.login(testConfig.username, testConfig.password);

    //View Dashboard page
    await dashboardPage.expectLoaded();

    //Add an employee through PIM
    await dashboardPage.openPim();
    const employeeName = await pimPage.addEmployee({
        username: generatedUsername,
        password: generatedPassword
    });

    //Navigate to Admin - User Management Page to add a user
    await adminPage.logInfo(scenario, 'Add user role to the employee');
    await adminPage.viewAdminPage();
    await adminPage.openAddUserForm();
    await adminPage.addUserRole(employeeName, newGeneratedUsername, generatedPassword);
    await loginPage.logout();

    //Login with the new user
    await adminPage.logInfo(scenario, 'Login with the new user credentials\n');
    await loginPage.login(generatedUsername, generatedPassword);
    await loginPage.expectLoggedIn();
    await dashboardPage.openDashboard();
    await dashboardPage.expectLoaded();
    await loginPage.logout();
  });
});

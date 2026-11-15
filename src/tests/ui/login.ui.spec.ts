import { test } from '../../fixtures/uiFixtures';
import { testConfig } from '../../config';
import userInfoConfig from '../../data/userData.json';
import validatationText from '../../data/validationMessages.json';

test.describe('OrangeHRM UI: login', () => {
  test.describe.configure({ mode: 'serial' });
  const scenario = 'Admin - Add User';

  test('valid credentials land the user on the dashboard @smoke', async ({
    pimPage,
    loginPage,
    dashboardPage,
    adminPage,
  }) => {
    const generatedUsername = adminPage.generateUsername();
    const generatedPassword = adminPage.generatePassword();

    await adminPage.logInfo(scenario, 'Login as admin');
    await loginPage.login(testConfig.username, testConfig.password);

    //View Dashboard page
    await dashboardPage.expectLoaded();

    //Add am employee through PIM
    const employeeName = await pimPage.addEmployee();

    //Navigate to Admin - User Management Page to add a user
    await adminPage.logInfo(scenario, 'Add user');
    await adminPage.viewAdminPage();
    await adminPage.openAddUserForm();
    await adminPage.addUser(employeeName, generatedUsername, generatedPassword);
    await loginPage.logout();

    //Login with the new user
    await adminPage.logInfo(scenario, 'Login with the new user credentials\n');
    await loginPage.login(generatedUsername, generatedPassword);

    // axeUtil, crossBrowser setup
  });

  test('invalid credentials show an error and keep the user on the login page', async ({
    adminPage,
    loginPage,
  }) => {
    await adminPage.logInfo(scenario, 'Login with invalid admin credentials\n');
    await loginPage.login(testConfig.username, 'definitely-wrong-password');
    await loginPage.invalidLoginCheck();
  });

  test('add user rejects invalid input with the right validation messages', async ({
    loginPage,
    dashboardPage,
    adminPage,
  }) => {
    await adminPage.logInfo(scenario, 'Add User form validations\n');
    await loginPage.login(testConfig.username, testConfig.password);
    await dashboardPage.expectLoaded();
    await adminPage.viewAdminPage();
    await adminPage.openAddUserForm();

    await test.step('Empty mandatory fields', async () => {
      const emptyForm = 'Empty form';
      await adminPage.submitUserForm();
      for (const label of ['User Role', 'Employee Name', 'Status', 'Username', 'Password']) {
          await adminPage.expectValidationError(emptyForm, label, validatationText.required);
      }
      await adminPage.expectStillOnAddUserForm();
      await adminPage.resetAddUserForm();
    });

    await test.step('Password and confirm password differ', async () => {
      const pwd = adminPage.generatePassword();
      await adminPage.fillUserForm({ password: pwd, confirmPassword: pwd + 'x' });
      await adminPage.expectValidationError('Password mismatch', 'Confirm Password', validatationText.passwordMismatch);
      await adminPage.resetAddUserForm();
    });

    await test.step('Username already exists', async () => {
      await adminPage.fillUserForm({ username: userInfoConfig.existingUsername });
      await adminPage.expectValidationError('Duplicate username', 'Username', validatationText.usernameExists);
      await adminPage.resetAddUserForm();
    });

    await test.step('Username and password too short', async () => {
      await adminPage.fillUserForm({ username: 'ab', password: 'abc', confirmPassword: 'abc' });
      await adminPage.expectValidationError('Short username', 'Username', validatationText.usernameTooShort);
      await adminPage.expectValidationError('Short password', 'Password', validatationText.passwordTooShort);
    });
  });
});

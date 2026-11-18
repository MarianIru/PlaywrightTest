import { test } from '../../fixtures/uiFixtures';
import { testConfig } from '../../config';
import userInfoConfig from '../../data/userData.json';
import validatationText from '../../data/validationMessages.json';

test.describe('OrangeHRM UI: Negative scenarios', () => {
  const scenario = 'Admin - Invalid login and incomplete add user form';

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

    test('PIM add employee rejects invalid login details with the right validation messages', async ({
      loginPage,
      dashboardPage,
      pimPage,
    }) => {
      const pimScenario = 'PIM - Add Employee login details';

      await pimPage.logInfo(pimScenario, 'Login details validations\n');
      await loginPage.login(testConfig.username, testConfig.password);
      await dashboardPage.expectLoaded();
      await dashboardPage.openPim();
      await pimPage.openAddEmployeeForm();

      await test.step('Empty login details', async () => {
        const emptyForm = 'Empty login details';
        await pimPage.enableLoginDetails();
        await pimPage.submitEmployeeForm();
        for (const label of ['Username', 'Password']) {
          await pimPage.expectValidationError(emptyForm, label, validatationText.required);
        }
        await pimPage.expectValidationError(emptyForm, 'Confirm Password', validatationText.passwordMismatch);
        await pimPage.expectStillOnAddEmployee();
        await pimPage.resetAddEmployeeForm();
      });

        await test.step('Password and confirm password differ', async () => {
          const pwd = pimPage.generatePassword();
          await pimPage.enableLoginDetails();
          await pimPage.fillLoginDetails({ password: pwd, confirmPassword: pwd + 'x' });
          await pimPage.expectValidationError('Password mismatch', 'Confirm Password', validatationText.passwordMismatch);
          await pimPage.resetAddEmployeeForm();
        });

        await test.step('Username already exists', async () => {
          await pimPage.enableLoginDetails();
          await pimPage.fillLoginDetails({ username: userInfoConfig.existingUsername });
          await pimPage.expectValidationError('Duplicate username', 'Username', validatationText.pimUsernameExists);
          await pimPage.resetAddEmployeeForm();
        });

        await test.step('Username and password too short', async () => {
          await pimPage.enableLoginDetails();
          await pimPage.fillLoginDetails({ username: 'ab', password: 'abc', confirmPassword: 'abc' });
          await pimPage.expectValidationError('Short username', 'Username', validatationText.usernameTooShort);
          await pimPage.expectValidationError('Short password', 'Password', validatationText.passwordTooShort);
          await pimPage.resetAddEmployeeForm();
        });

        await test.step('Password without a number', async () => {
          await pimPage.enableLoginDetails();
          await pimPage.fillLoginDetails({ password: 'LettersOnly', confirmPassword: 'LettersOnly' });
          await pimPage.expectValidationError('Password without a number', 'Password', validatationText.passwordNoNumber);
        });
    });
});

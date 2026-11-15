import { test as base, expect } from '@playwright/test';
import { PetClient } from '../pages/api/PetClient';

type ApiFixtures = { petClient: PetClient };

export const test = base.extend<ApiFixtures>({
  // Fixture = setup + teardown in one place. Anything created through the client is removed afterwards,
  // even when the test fails.
  petClient: async ({ request }, use) => {
    const client = new PetClient(request);
    await use(client);
    await client.cleanup();
  },
});

export { expect };

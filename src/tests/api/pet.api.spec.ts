import { test, expect } from '../../fixtures/apiFixtures';
import { buildPet, uniqueId } from '../../pages/api/petFactory';
import { ApiError, Pet } from '../../pages/api/types';

test.describe('Petstore API: /pet', () => {
  test.describe('positive', () => {
    test('create, retrieve and delete a pet @smoke', async ({ petClient }) => {
      const pet = buildPet({ status: 'available' });

      await test.step('POST /pet creates the pet and echoes it back', async () => {
        const response = await petClient.create(pet);
        expect(response.status()).toBe(200);
        expect(await response.json()).toMatchObject(pet);
      });

      await test.step('GET /pet/{id} returns the persisted pet', async () => {
        const response = await petClient.getById(pet.id);
        expect(response.status()).toBe(200);
        const body = (await response.json()) as Pet;
        expect(body).toMatchObject({ id: pet.id, name: pet.name, status: 'available' });
      });

      await test.step('DELETE /pet/{id} removes it, after which GET returns 404', async () => {
        expect((await petClient.delete(pet.id)).status()).toBe(200);
        expect((await petClient.getById(pet.id)).status()).toBe(404);
      });
    });
  });

  test.describe('negative', () => {
    test('GET unknown pet id returns 404 with an error body', async ({ petClient }) => {
      const response = await petClient.getById(uniqueId());

      expect(response.status()).toBe(404);
      const body = (await response.json()) as ApiError;
      expect(body.type).toBe('error');
      expect(body.message).toBe('Pet not found');
    });

    test('GET with a non-numeric pet id is rejected with a 4xx', async ({ petClient }) => {
      const response = await petClient.getById('not-a-number');

      // Petstore returns 404 here although the Swagger spec documents 400; we assert the
      // behaviour that matters (a client error, never a 5xx or a 200) and record the discrepancy in docs.
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });

    test('POST with a malformed JSON body is rejected with a 4xx', async ({ petClient }) => {
      const response = await petClient.createRaw('{"id": 123, "name": ');

      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);
    });
  });
});

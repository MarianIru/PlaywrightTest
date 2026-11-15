import { Pet } from './types';

/** Collision-resistant id so parallel workers and repeated runs never clash on the shared public API. */
export function uniqueId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1_000_000_000;
}

/** Test-data builder: valid by default, override only what the test cares about. */
export function buildPet(overrides: Partial<Pet> = {}): Pet {
  const id = overrides.id ?? uniqueId();
  return {
    id,
    category: { id: 1, name: 'dogs' },
    name: `qa-pet-${id}`,
    photoUrls: ['https://example.com/photo.jpg'],
    tags: [{ id: 1, name: 'automation' }],
    status: 'available',
    ...overrides,
  };
}

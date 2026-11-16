import { Pet } from './types';

/** Collision-resistant id for unique vslue. */
export function uniqueId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1_000_000_000;
}

/** Test-data builder for default value */
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

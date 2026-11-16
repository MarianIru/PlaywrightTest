import { APIRequestContext, APIResponse } from '@playwright/test';
import { Pet } from './types';
import { PetStatus } from './types';

/**
 * Thin API client for the /pet resource. Tests describe *what* to verify;
 * this class owns *how* to call the service (paths, headers, cleanup).
 */
export class PetClient {
  private readonly createdIds = new Set<number>();

  constructor(private readonly request: APIRequestContext) {}

  async create(pet: Pet): Promise<APIResponse> {
    const response = await this.request.post('pet', { data: pet });
    if (response.ok()) this.createdIds.add(pet.id);
    return response;
  }

  getById(id: number | string): Promise<APIResponse> {
    return this.request.get(`pet/${id}`);
  }

  update(pet: Pet): Promise<APIResponse> {
    return this.request.put('pet', { data: pet });
  }

  updateById(id: number | string, fields: { name?: string; status?: PetStatus }): Promise<APIResponse> {
      return this.request.post(`pet/${id}`, { form: fields });
  }

  async delete(id: number | string): Promise<APIResponse> {
    return this.request.delete(`pet/${id}`);
  }

  /** Sends a raw string body, used to exercise malformed-input handling. */
  createRaw(rawBody: string): Promise<APIResponse> {
    return this.request.post('pet', {
      data: Buffer.from(rawBody),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** Best-effort teardown so the shared public service is not littered with test data. */
  async cleanup(): Promise<void> {
    await Promise.allSettled([...this.createdIds].map((id) => this.delete(id)));
    this.createdIds.clear();
  }
}

import * as repo from '@/lib/repos/experienceRepo';
import { experienceSchema } from '@/lib/validation/learning';

export async function listExperiences() {
  return repo.getExperiences();
}

export async function createExperience(payload: unknown) {
  const parsed = experienceSchema.parse(payload);
  return repo.createExperience(parsed as any);
}

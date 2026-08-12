import * as repo from '@/lib/repos/conceptRepo';
import { conceptSchema } from '@/lib/validation/learning';

export async function listConcepts() {
  return repo.getConcepts();
}

export async function createConcept(payload: unknown) {
  const parsed = conceptSchema.parse(payload);
  return repo.createConcept(parsed as any);
}

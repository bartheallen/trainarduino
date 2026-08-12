import * as repo from '@/lib/repos/skillRepo';
import { skillSchema } from '@/lib/validation/learning';

export async function listSkills() {
  return repo.getSkills();
}

export async function createSkill(payload: unknown) {
  const parsed = skillSchema.parse(payload);
  return repo.createSkill(parsed as any);
}

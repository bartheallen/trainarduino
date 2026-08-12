import * as repo from '@/lib/repos/projectRepo';
import { projectSchema } from '@/lib/validation/learning';

export async function listProjects() {
  return repo.getProjects();
}

export async function createProject(payload: unknown) {
  const parsed = projectSchema.parse(payload);
  return repo.createProject(parsed as any);
}

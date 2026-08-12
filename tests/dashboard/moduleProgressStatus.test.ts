import { describe, expect, it } from 'vitest';
import { getModuleStatuses } from '@/lib/moduleProgressStatus';

describe('getModuleStatuses', () => {
  it('débloque le premier module quand l’utilisateur n’a encore aucune progression', () => {
    const modules = [
      { id: 1, ordre: 1, titre: 'Module 1' },
      { id: 2, ordre: 2, titre: 'Module 2' },
    ] as Array<{ id: number; ordre: number; titre: string }>;

    const statuses = getModuleStatuses(modules, []);

    expect(statuses[0].status).toBe('available');
    expect(statuses[1].status).toBe('locked');
  });

  it('débloque le module suivant uniquement après la validation du précédent', () => {
    const modules = [
      { id: 1, ordre: 1, titre: 'Module 1' },
      { id: 2, ordre: 2, titre: 'Module 2' },
      { id: 3, ordre: 3, titre: 'Module 3' },
    ] as Array<{ id: number; ordre: number; titre: string }>;

    const statuses = getModuleStatuses(modules, [{ module_id: 1, statut: 'completed' } as any]);

    expect(statuses[0].status).toBe('completed');
    expect(statuses[1].status).toBe('available');
    expect(statuses[2].status).toBe('locked');
  });
});

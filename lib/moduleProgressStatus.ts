export interface ModuleProgressStatusItem {
  id: number;
  ordre: number;
  titre: string;
  status: 'locked' | 'available' | 'completed';
  score?: number;
  completed_exercises?: number;
}

export function getModuleStatuses<T extends { id: number; ordre: number; titre: string }>(
  modules: T[],
  progress: Array<{ module_id: number; statut?: string; score?: number; exercices_completes?: number }>
): ModuleProgressStatusItem[] {
  const progressByModuleId = new Map(progress.map((item) => [item.module_id, item]));

  return modules.map((module, index) => {
    const userProgress = progressByModuleId.get(module.id);

    if (userProgress?.statut === 'completed') {
      return {
        ...module,
        status: 'completed' as const,
        score: userProgress.score ?? 0,
        completed_exercises: userProgress.exercices_completes ?? 0,
      };
    }

    if (userProgress?.statut === 'in_progress') {
      return {
        ...module,
        status: 'available' as const,
        score: userProgress.score ?? 0,
        completed_exercises: userProgress.exercices_completes ?? 0,
      };
    }

    const previousModule = modules[index - 1];
    const previousProgress = previousModule ? progressByModuleId.get(previousModule.id) : undefined;
    const isFirstModule = index === 0;
    const isUnlocked = isFirstModule || previousProgress?.statut === 'completed' || previousProgress?.statut === 'in_progress';

    return {
      ...module,
      status: isUnlocked ? 'available' : 'locked',
      score: userProgress?.score ?? 0,
      completed_exercises: userProgress?.exercices_completes ?? 0,
    };
  });
}

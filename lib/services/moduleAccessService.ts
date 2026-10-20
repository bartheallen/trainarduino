import type { Module, PositioningTestResult, Progress } from '@/lib/types';

export type ModuleAccessState = 'completed' | 'in_progress' | 'available' | 'locked';

export function getModuleAccessState(
  module: Module,
  index: number,
  modules: Module[],
  progress: Progress[],
  placement: PositioningTestResult | null,
): ModuleAccessState {
  const currentProgress = progress.find((item) => item.module_id === module.id);
  if (currentProgress?.statut === 'completed') return 'completed';
  if (currentProgress?.statut === 'in_progress') return 'in_progress';

  const previousModule = modules[index - 1];
  const previousProgress = previousModule
    ? progress.find((item) => item.module_id === previousModule.id)
    : null;
  const previousCompleted = previousProgress?.statut === 'completed';
  const placementCeiling = Math.min(6, placement?.palier_atteint ?? 1);
  const placementUnlock = module.ordre <= 6 && module.ordre <= placementCeiling;

  return index === 0 || placementUnlock || previousCompleted ? 'available' : 'locked';
}

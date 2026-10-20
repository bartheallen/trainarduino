export const LEVEL_NAMES = ['Débutant', 'Apprenti', 'Intermédiaire', 'Avancé', 'Expert'] as const;

export function getEvolutionLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.max(0, Math.ceil(level / 2) - 1))];
}

export function getPlacementLevelName(score: number | null | undefined): string {
  const percentage = Number(score ?? 0);
  if (percentage >= 90) return 'Expert';
  if (percentage >= 70) return 'Avancé';
  if (percentage >= 40) return 'Intermédiaire';
  return 'Débutant';
}
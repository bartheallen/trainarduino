import type { PersonalizationPlan, PersonalizationRequest, PersonalizedContent } from '@/lib/personalization/types';
import * as adaptiveEngineService from '@/lib/services/adaptiveEngineService';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function makeContent(type: PersonalizedContent['type'], title: string, description: string, minutes: number, difficulty: number, concepts: string[]): PersonalizedContent {
  return {
    id: `${type}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    type,
    title,
    description,
    estimatedMinutes: minutes,
    difficulty,
    concepts,
  };
}

export async function buildPersonalizationPlan(request: PersonalizationRequest): Promise<PersonalizationPlan> {
  const recommendation = await adaptiveEngineService.recommendAdaptiveActions(request.userId).catch(() => null);
  const baseDifficulty = request.difficultyLevel === 'hard' ? 4 : request.difficultyLevel === 'easy' ? 2 : 3;
  const concepts = request.targetConcept ? [request.targetConcept] : ['arduino-basics'];
  const availableMinutes = request.availableMinutes ?? 45;

  const candidates: Array<{ type: PersonalizedContent['type']; title: string; description: string; minutes: number; difficulty: number }> = [
    {
      type: 'review',
      title: 'Révision ciblée',
      description: `Revoir ${concepts[0]} avec une approche progressive et visuelle.`,
      minutes: 15,
      difficulty: clamp(baseDifficulty - 1, 1, 5),
    },
    {
      type: 'exercise',
      title: 'Exercice guidé',
      description: `Appliquer ${concepts[0]} dans un mini exercice concret.`,
      minutes: 20,
      difficulty: baseDifficulty,
    },
    {
      type: 'challenge',
      title: 'Défi d’application',
      description: `Pousser ${concepts[0]} vers un scénario plus ambitieux.`,
      minutes: 20,
      difficulty: clamp(baseDifficulty + 1, 1, 5),
    },
    {
      type: 'project',
      title: 'Mini-projet',
      description: `Synthétiser ${concepts[0]} à travers un mini-projet.`,
      minutes: 25,
      difficulty: clamp(baseDifficulty + 1, 1, 5),
    },
  ];

  const shouldIncludeProject = request.includeProjects || recommendation?.recommendedAction === 'project';
  const shouldIncludeChallenge = request.difficultyLevel === 'hard' || recommendation?.recommendedAction === 'challenge' || recommendation?.recommendedAction === 'unlock' || (shouldIncludeProject && availableMinutes >= 40);

  const selected = [request.preferReview ?? true ? candidates[0] : null, candidates[1], shouldIncludeProject ? candidates[2] : null, shouldIncludeChallenge ? candidates[3] : null]
    .filter(Boolean)
    .reduce((acc, candidate) => {
      if (!candidate) return acc;
      const remainingMinutes = availableMinutes - acc.usedMinutes;
      if (remainingMinutes <= 0) return acc;

      const effectiveMinutes = Math.min(candidate.minutes, remainingMinutes);
      acc.items.push({ ...candidate, minutes: effectiveMinutes });
      acc.usedMinutes += effectiveMinutes;
      return acc;
    }, { items: [] as Array<(typeof candidates)[number] & { minutes: number }>, usedMinutes: 0 });

  const planContent = selected.items.map((item) => makeContent(item.type, item.title, item.description, item.minutes, item.difficulty, concepts));

  if (planContent.length === 0) {
    planContent.push(makeContent('exercise', 'Exercice guidé', `Appliquer ${concepts[0]} dans un mini exercice concret.`, 20, baseDifficulty, concepts));
  }

  return {
    userId: request.userId,
    targetConcept: request.targetConcept,
    estimatedMinutes: planContent.reduce((sum, item) => sum + item.estimatedMinutes, 0),
    content: planContent,
    rationale: [
      'Le plan adapte le niveau de difficulté à la progression récente.',
      'Le format mixte combine révision, pratique et projet.',
    ],
  };
}

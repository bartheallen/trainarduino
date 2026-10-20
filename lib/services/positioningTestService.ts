import * as db from '@/lib/db';

type PositioningLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface PositioningResult {
  score: number;
  totalQuestions: number;
  palierAtteint: number;
  levelName: PositioningLevel;
}

export function determinePositioningLevel(score: number, totalQuestions: number): PositioningResult {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const levelName: PositioningLevel = percentage >= 90
    ? 'expert'
    : percentage >= 70
      ? 'advanced'
      : percentage >= 40
        ? 'intermediate'
        : 'beginner';
  // A placement test gives a sensible starting point, not permission to skip the path.
  // Six is deliberately the ceiling: later sensor modules are earned by practical work.
  const palierAtteint = percentage >= 90 ? 6 : percentage >= 70 ? 4 : percentage >= 40 ? 2 : 1;

  return {
    score: percentage,
    totalQuestions,
    palierAtteint,
    levelName,
  };
}

export async function savePositioningTestResult(userId: string, correctAnswers: number, totalQuestions: number) {
  const result = determinePositioningLevel(correctAnswers, totalQuestions);
  const created = await db.upsertPositioningTestResult(
    userId,
    result.palierAtteint,
    result.score,
    correctAnswers,
    totalQuestions
  );

  await db.updateUserLevel(userId, result.palierAtteint).catch(() => null);
  return created;
}

import * as db from '@/lib/db';

type PositioningLevel = 'beginner' | 'intermediate' | 'advanced';

export interface PositioningResult {
  score: number;
  totalQuestions: number;
  palierAtteint: number;
  levelName: PositioningLevel;
}

export function determinePositioningLevel(score: number, totalQuestions: number): PositioningResult {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const levelName: PositioningLevel = percentage >= 80 ? 'advanced' : percentage >= 60 ? 'intermediate' : 'beginner';
  const palierAtteint = levelName === 'advanced' ? 3 : levelName === 'intermediate' ? 2 : 1;

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

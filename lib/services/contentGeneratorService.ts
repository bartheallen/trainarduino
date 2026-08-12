import type { RecommendationCandidate } from '@/lib/recommendation/interfaces';
import * as db from '@/lib/db';
import * as learningProfileRepo from '@/lib/repos/learningProfileRepo';
import * as memoryEngine from '@/lib/services/memoryEngineService';
import type { Profile } from '@/lib/types';

const CONTENT_TYPES = ['generated_exercise', 'generated_quiz', 'generated_project', 'generated_challenge', 'generated_exam'] as const;
export type GeneratedContentType = (typeof CONTENT_TYPES)[number];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function makeId(type: string, key: string) {
  const safeKey = key
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `${type}-${safeKey}-${Math.random().toString(36).slice(2, 8)}`;
}

function humanizeConcept(concept: string) {
  return concept
    .toString()
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, 40);
}

function buildConceptPhrase(concepts: string[]) {
  if (concepts.length === 0) return 'Arduino fondamentaux';
  if (concepts.length === 1) return humanizeConcept(concepts[0]);
  if (concepts.length === 2) return `${humanizeConcept(concepts[0])} et ${humanizeConcept(concepts[1])}`;
  return `${humanizeConcept(concepts[0])}, ${humanizeConcept(concepts[1])} et ${humanizeConcept(concepts[2])}`;
}

function defaultUserProfile(userProfile: Profile | null) {
  return {
    niveau_actuel: userProfile?.niveau_actuel ?? 1,
    xp_total: userProfile?.xp_total ?? 0,
  };
}

function buildReviewCandidate(concepts: string[], targetDifficulty: number): RecommendationCandidate {
  const title = `Quiz de révision sur ${buildConceptPhrase(concepts)}`;
  return {
    id: makeId('quiz', title),
    type: 'generated_quiz',
    payload: {
      title,
      description: `Révisez ${buildConceptPhrase(concepts)} avec un mini-quiz Arduino conçu pour renforcer les notions clés.`, 
      concepts,
      difficulty: clamp(targetDifficulty - 1, 1, 5),
      source: 'adaptive_generator',
      recommendedFor: 'review',
      details: 'Contient des questions à choix multiple et vrai/faux pour valider votre compréhension.',
      metadata: {
        category: 'quiz',
      },
    },
  };
}

function buildExerciseCandidate(concepts: string[], targetDifficulty: number, theme: string): RecommendationCandidate {
  const title = `Exercice Arduino : ${theme}`;
  return {
    id: makeId('exercise', title),
    type: 'generated_exercise',
    payload: {
      title,
      description: `Créez un sketch Arduino qui met en œuvre ${buildConceptPhrase(concepts)}. Concentrez-vous sur la qualité du code et le respect des bonnes pratiques.`, 
      concepts,
      difficulty: clamp(targetDifficulty, 1, 5),
      source: 'adaptive_generator',
      recommendedFor: 'reinforcement',
      details: `Cet exercice vise à renforcer les compétences autour de ${buildConceptPhrase(concepts)}.`,
      metadata: {
        task: `Renforcement sur ${buildConceptPhrase(concepts)}`,
      },
    },
  };
}

function buildProjectCandidate(concepts: string[], targetDifficulty: number): RecommendationCandidate {
  const title = `Mini-projet : ${buildConceptPhrase(concepts)}`;
  return {
    id: makeId('project', title),
    type: 'generated_project',
    payload: {
      title,
      description: `Réalisez un mini-projet Arduino combinant ${buildConceptPhrase(concepts)}. Vous devez concevoir un montage stable et un code fiable.`, 
      concepts,
      difficulty: clamp(targetDifficulty + 1, 1, 5),
      source: 'adaptive_generator',
      recommendedFor: 'project',
      details: 'Ce mini-projet propose un travail transversal sur matériel, capteurs et logique. ',
      metadata: {
        projectType: 'mini-project',
      },
    },
  };
}

function buildChallengeCandidate(concepts: string[], targetDifficulty: number): RecommendationCandidate {
  const title = `Challenge avancé : ${buildConceptPhrase(concepts)}`;
  return {
    id: makeId('challenge', title),
    type: 'generated_challenge',
    payload: {
      title,
      description: `Résolvez un défi Arduino complexe autour de ${buildConceptPhrase(concepts)}. Le challenge demande de gérer des contraintes de performance et de robustesse.`, 
      concepts,
      difficulty: clamp(targetDifficulty + 1, 1, 5),
      source: 'adaptive_generator',
      recommendedFor: 'challenge',
      details: 'Ce défi met l’accent sur la synthèse des compétences Arduino avancées.',
      metadata: {
        challengeLevel: 'advanced',
      },
    },
  };
}

function buildExamCandidate(concepts: string[], targetDifficulty: number): RecommendationCandidate {
  const title = `Examen de synthèse : ${buildConceptPhrase(concepts)}`;
  return {
    id: makeId('exam', title),
    type: 'generated_exam',
    payload: {
      title,
      description: `Passez un examen de synthèse sur ${buildConceptPhrase(concepts)}. Ce parcours évalue vos compétences Arduino de manière globale.`, 
      concepts,
      difficulty: clamp(targetDifficulty + 1, 1, 5),
      source: 'adaptive_generator',
      recommendedFor: 'exam',
      details: 'Regroupe plusieurs types de questions et un exercice pratique. ',
      metadata: {
        examFormat: 'mixed',
      },
    },
  };
}

export async function generateAdaptiveContentCandidates(userId: string, limit = 6) {
  const [profile, projection, submissions, userProfile] = await Promise.all([
    learningProfileRepo.getProfileByUserId(userId).catch(() => null),
    memoryEngine.getDashboardProjection(userId).catch(() => null),
    db.getUserSubmissions(userId).catch(() => []),
    db.getUserProfile(userId).catch(() => null),
  ]);

  const weakConcepts = Array.isArray(projection?.weak_concepts) ? projection?.weak_concepts.map(String).filter(Boolean) : [];
  const strongConcepts = Array.isArray(projection?.strong_concepts) ? projection?.strong_concepts.map(String).filter(Boolean) : [];
  const effectiveProfile = defaultUserProfile(userProfile);
  const userLevel = clamp(Number(effectiveProfile.niveau_actuel ?? 1), 1, 10);
  const preferredProjectDifficulty = clamp(profile?.preferred_project_difficulty ?? Math.max(1, Math.min(5, Math.ceil(userLevel / 2) + 1)), 1, 5);
  const targetDifficulty = clamp(Math.max(1, Math.min(5, Math.round(userLevel * 0.8))), 1, 5);
  const recentAttempts = submissions.slice(0, 10);

  const candidates: RecommendationCandidate[] = [];
  const reviewConcepts = weakConcepts.length ? weakConcepts.slice(0, 2) : strongConcepts.slice(0, 2);
  const coreConcepts = weakConcepts.length ? weakConcepts.slice(0, 3) : strongConcepts.slice(0, 3);

  if (reviewConcepts.length > 0) {
    candidates.push(buildReviewCandidate(reviewConcepts, targetDifficulty));
  }

  if (coreConcepts.length > 0) {
    candidates.push(buildExerciseCandidate(coreConcepts, targetDifficulty, `renforcement ${buildConceptPhrase(coreConcepts)}`));
  }

  if (strongConcepts.length > 0) {
    candidates.push(buildChallengeCandidate(strongConcepts.slice(0, 2), targetDifficulty));
  }

  if (userLevel >= 3 || (weakConcepts.length > 1 && strongConcepts.length > 0)) {
    const projectConcepts = [...new Set([...strongConcepts.slice(0, 2), ...weakConcepts.slice(0, 1)])].slice(0, 3);
    candidates.push(buildProjectCandidate(projectConcepts.length ? projectConcepts : coreConcepts, preferredProjectDifficulty));
  }

  if (recentAttempts.length >= 4) {
    const examConcepts = [...new Set([...(weakConcepts.slice(0, 2)), ...(strongConcepts.slice(0, 2))])].slice(0, 3);
    if (examConcepts.length > 0) {
      candidates.push(buildExamCandidate(examConcepts, targetDifficulty));
    }
  }

  if (candidates.length === 0) {
    candidates.push(buildExerciseCandidate(['Arduino'], targetDifficulty, 'bases Arduino'));
  }

  const uniqueCandidates = candidates.reduce<Record<string, RecommendationCandidate>>((acc, candidate) => {
    if (!acc[candidate.id]) {
      acc[candidate.id] = candidate;
    }
    return acc;
  }, {});

  return Object.values(uniqueCandidates).slice(0, limit);
}

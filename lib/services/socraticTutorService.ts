import type { CorrectionReport } from '@/lib/correction/types';
import type { PedagogicalReport } from '@/lib/pedagogy/PedagogicalReport';
import type { StudentLearningProfile } from '@/lib/types';
import type { DashboardProjection } from '@/lib/memory/types';

export interface SocraticTutorContext {
  userId?: string;
  exerciseId?: number | null;
  learningProfile?: StudentLearningProfile | null;
  dashboardProjection?: DashboardProjection | null;
  conceptStates?: any[];
  learningDna?: Record<string, any> | null;
  pedagogicalReport?: PedagogicalReport | null;
  correctionReport?: CorrectionReport | null;
  memorySummary?: string | null;
}

export interface SocraticLearningPlan {
  nextLessons: string[];
  nextExercises: string[];
  nextProjects: string[];
  reviewItems: string[];
  challenges: string[];
  confidenceAdvice: string;
}

function levelFromContext(context: SocraticTutorContext, pedagogical?: PedagogicalReport) {
  if (pedagogical?.knowledgeLevel) return pedagogical.knowledgeLevel;
  if (typeof context.learningProfile?.confidence_score === 'number') {
    const score = context.learningProfile.confidence_score;
    return score >= 80 ? 'advanced' : score >= 50 ? 'intermediate' : 'beginner';
  }
  return 'intermediate';
}

function chooseCoreConcept(report: PedagogicalReport) {
  if (report.weakConcepts.length > 0) return report.weakConcepts[0];
  if (report.mistakes.length > 0) return report.mistakes[0].category;
  return 'Arduino';
}

function baseQuestionForCategory(category: string, level: string) {
  switch (category) {
    case 'syntax':
      return level === 'beginner'
        ? 'Quel symbole manque à la fin de cette ligne pour terminer correctement l’instruction ?'
        : 'Quel élément de syntaxe permet de fermer une instruction en C++/Arduino ?';
    case 'logic':
      return level === 'beginner'
        ? 'Quelle étape du programme se répète et comment pouvez-vous vérifier qu’elle s’exécute comme prévu ?'
        : 'Quel est l’objectif principal de cette boucle et comment vérifiez-vous sa condition ?';
    case 'electronics':
      return 'Avant d’utiliser une broche, qu’est-ce qu’il faut vérifier sur le montage et dans le code ?';
    case 'memory':
      return 'Que se passe-t-il si la variable que vous utilisez n’est pas initialisée avant l’usage ?';
    case 'performance':
      return 'Quelle partie du sketch pourrait être répétée trop souvent et comment limiter cette répétition ?';
    case 'style':
      return 'Quel avantage y a-t-il à organiser votre code en petites fonctions claires ?';
    default:
      return 'Quel concept Arduino est utilisé ici et pourquoi est-il important ?';
  }
}


export async function buildSocraticTutorContext(userId: string, exerciseId?: number): Promise<SocraticTutorContext> {
  const [adaptiveLearningService, memoryEngine, learningMemoryService] = await Promise.all([
    import('./adaptiveLearningService'),
    import('./memoryEngineService'),
    import('./learningMemoryService'),
  ]);

  const [learningProfile, dashboardProjection, conceptStates, learningDna] = await Promise.all([
    adaptiveLearningService.getLearningProfile(userId).catch(() => null),
    memoryEngine.getDashboardProjection(userId).catch(() => null),
    memoryEngine.getConcepts().catch(() => []),
    memoryEngine
      .getDashboardProjection(userId)
      .then((proj) => ({ user_id: userId, traits: proj?.learning_dna ?? {} }))
      .catch(() => ({ user_id: userId, traits: {} })),
  ]);

  const memorySummary = await learningMemoryService.getLearningContextSummary(userId, exerciseId).catch(() => null);

  return {
    userId,
    exerciseId: exerciseId ?? null,
    learningProfile,
    dashboardProjection,
    conceptStates,
    learningDna,
    memorySummary,
  };
}

export async function generateFirstQuestion(report: PedagogicalReport, context: SocraticTutorContext = {}): Promise<string> {
  const level = levelFromContext(context, report);
  const mainConcept = chooseCoreConcept(report);
  const question = baseQuestionForCategory(report.mistakes[0]?.category ?? mainConcept, level);
  return `Pour commencer, réfléchis à ceci : ${question}`;
}

export async function generateHint(report: PedagogicalReport, context: SocraticTutorContext = {}): Promise<string> {
  const level = levelFromContext(context, report);
  const issue = report.mistakes[0];
  if (!issue) {
    return 'Relis ton code et identifie le point où le comportement diffère de l’objectif attendu.';
  }

  const hintBase = issue.category === 'electronics'
    ? 'Vérifie la configuration matérielle et le paramétrage des broches.'
    : issue.category === 'syntax'
      ? 'Vérifie l’écriture de cette instruction ligne par ligne.'
      : issue.category === 'logic'
        ? 'Vérifie si la logique suit bien le flux attendu dans la boucle.'
        : 'Focalise-toi sur le concept principal et cherche où il est mal appliqué.';

  return level === 'beginner'
    ? `${hintBase} Commence par expliquer à voix haute ce que fait cette ligne.`
    : `${hintBase} Quel résultat attends-tu sur cette portion du sketch ?`;
}

export async function generateNextQuestion(previousQuestion: string, report: PedagogicalReport, _context: SocraticTutorContext = {}): Promise<string> {
  const issue = report.mistakes[0];
  if (!issue) {
    return 'Continue à vérifier si ton code suit bien l’ordre des opérations Arduino : configuration, boucle, actions.';
  }

  if (previousQuestion.toLowerCase().includes('quelle fonction')) {
    return issue.category === 'electronics'
      ? 'Sur quelle ligne du sketch définit-on un mode de broche avec pinMode ?'
      : 'Sur quelle ligne du code la vérification devrait-elle être effectuée ?';
  }

  if (issue.line) {
    return `Regarde la ligne ${issue.line}, qu’est-ce qui pourrait empêcher cette instruction de fonctionner correctement ?`;
  }

  return `Quel concept de ${issue.category} est-il le plus critique ici ?`;
}

export async function generateReflection(report: PedagogicalReport, _context: SocraticTutorContext = {}): Promise<string> {
  const misconception = report.misconceptions[0] ?? null;
  if (misconception) {
    return `Pourquoi as-tu pensé que « ${misconception} » était la bonne solution ?`; 
  }

  if (report.weakConcepts.length > 0) {
    return `Qu’est-ce qui te semble difficile concernant ${report.weakConcepts[0]} ?`; 
  }

  return 'Qu’as-tu appris de cette erreur et comment peux-tu l’éviter lors de ton prochain essai ?';
}

export async function generateSummary(report: PedagogicalReport, context: SocraticTutorContext = {}): Promise<string> {
  const level = levelFromContext(context, report);
  const coach = level === 'beginner' ? 'Commence par' : level === 'intermediate' ? 'Maintiens' : 'Affine';
  const strengths = report.strongConcepts.length > 0 ? `Tu maîtrises bien ${report.strongConcepts.slice(0, 2).join(' et ')}.` : '';
  const weakness = report.weakConcepts.length > 0 ? `Nous devons renforcer ${report.weakConcepts[0]}.` : '';
  const objective = report.nextObjective ? `Objectif suivant : ${report.nextObjective}` : 'Objectif suivant : consolider tes acquis.';

  return `${coach} ce qu’on a identifié : ${strengths} ${weakness} ${objective}`.trim();
}

export async function generateLearningPlan(report: PedagogicalReport, context: SocraticTutorContext = {}): Promise<SocraticLearningPlan> {
  const lessons = report.recommendedLessons.length > 0 ? report.recommendedLessons : [`Revoir ${chooseCoreConcept(report)}`];
  const exercises = report.recommendedExercises.length > 0 ? report.recommendedExercises : [`Exercice pratique sur ${chooseCoreConcept(report)}`];
  const projects = report.recommendedProjects.length > 0 ? report.recommendedProjects : [`Mini-projet axé sur ${chooseCoreConcept(report)}`];
  const reviewItems = report.reviewSchedule.map((item) => `${item.concept} (${item.urgency})`);
  const challenges: string[] = [];

  const confidenceAdvice = typeof context.learningProfile?.confidence_score === 'number'
    ? context.learningProfile.confidence_score >= 80
      ? 'Ta confiance est bonne, tu peux avancer vers des défis plus techniques.'
      : 'Concentre-toi sur des révisions ciblées avant de passer au suivant.'
    : 'Utilise les leçons recommandées pour renforcer tes bases.';

  if (context.userId) {
    await Promise.resolve().catch(() => null);
  }

  return {
    nextLessons: lessons,
    nextExercises: exercises,
    nextProjects: projects,
    reviewItems,
    challenges,
    confidenceAdvice,
  };
}

export async function detectMisconception(report: PedagogicalReport, context: SocraticTutorContext = {}): Promise<string> {
  if (report.misconceptions.length > 0) {
    return `Il semble y avoir une confusion sur : ${report.misconceptions[0]}.`; 
  }

  const repeatedConcepts = report.mistakes
    .map((mistake) => mistake.category)
    .reduce<Record<string, number>>((acc, category) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  const repeated = Object.entries(repeatedConcepts).sort((a, b) => b[1] - a[1])[0];
  if (repeated && repeated[1] > 1) {
    return `Tu as plusieurs erreurs sur ${repeated[0]}. Peut-être que le concept n’est pas pleinement compris.`;
  }

  if (context.memorySummary) {
    return 'Revois les enregistrements de tes erreurs précédentes pour identifier la piste la plus fréquente.';
  }

  return 'Aucune misconception claire détectée, mais reste attentif aux prochaines erreurs similaires.';
}

export const SocraticTutorService = {
  buildSocraticTutorContext,
  generateFirstQuestion,
  generateHint,
  generateNextQuestion,
  generateReflection,
  generateSummary,
  generateLearningPlan,
  detectMisconception,
};

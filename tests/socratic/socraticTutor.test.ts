import { describe, it, expect } from 'vitest';
import { SocraticTutorService } from '@/lib/services/socraticTutorService';
import type { PedagogicalReport } from '@/lib/pedagogy/PedagogicalReport';

describe('SocraticTutorService', () => {
  const sampleReport: PedagogicalReport = {
    overallScore: 0.7,
    knowledgeLevel: 'intermediate',
    difficulty: 3,
    mistakes: [
      { id: '1', category: 'logic', message: 'Boucle infinie', severity: 'warning', line: 12 },
    ],
    weakConcepts: ['Boucles'],
    strongConcepts: ['Variables'],
    misconceptions: ['utiliser digitalWrite sans pinMode'],
    recommendedLessons: ['Boucles en Arduino'],
    recommendedExercises: ['exercice-boucles'],
    recommendedProjects: ['mini-projet-led'],
    reviewSchedule: [{ concept: 'Boucles', when: new Date().toISOString(), urgency: 'high' }],
    nextObjective: 'Corriger la condition de la boucle',
    confidence: 60,
    estimatedMastery: { Boucles: 45 },
    studentExplanation: 'Je ne comprends pas encore comment fonctionne la boucle.',
    teacherExplanation: 'La boucle doit s’arrêter lorsque la condition est fausse.',
    shortFeedback: 'Revois les boucles.',
    longFeedback: 'Votre boucle ne sort jamais.',
    socraticQuestions: ['Pourquoi la boucle tourne-t-elle encore ?'],
    hints: ['Vérifie la condition de sortie.'],
    learningObjectives: ['Comprendre la condition de boucle'],
  };

  it('generates first question for intermediate learner', async () => {
    const question = await SocraticTutorService.generateFirstQuestion(sampleReport);
    expect(question).toContain('réfléchis');
  });

  it('generates a hint that does not reveal the solution', async () => {
    const hint = await SocraticTutorService.generateHint(sampleReport);
    expect(hint).toContain('Vérifie');
    expect(hint).not.toContain('ajoute');
  });

  it('generates a next question based on previous question', async () => {
    const next = await SocraticTutorService.generateNextQuestion('Quelle fonction dois-je utiliser ?', sampleReport);
    expect(next).toContain('ligne');
  });

  it('detects misconception from pedagogical report', async () => {
    const misconception = await SocraticTutorService.detectMisconception(sampleReport);
    expect(misconception).toContain('confusion');
  });

  it('generates a summary with advice', async () => {
    const summary = await SocraticTutorService.generateSummary(sampleReport);
    expect(summary).toContain('Objectif suivant');
  });
});

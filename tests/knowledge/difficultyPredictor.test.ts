import { describe, it, expect, beforeEach } from 'vitest';
import * as difficultyPredictorService from '@/lib/services/difficultyPredictorService';
import type { KnowledgeGraphNode, KnowledgeGraphSnapshot } from '@/lib/services/knowledgeGraphService';
import type { LearningDNA } from '@/lib/memory/types';

describe('DifficultyPredictorService', () => {
  let mockGraph: KnowledgeGraphSnapshot;
  let mockLearningDna: LearningDNA;

  beforeEach(() => {
    const nodes: KnowledgeGraphNode[] = [
      {
        id: 'c1',
        key: 'led-basics',
        title: 'LED Basics - Getting Started',
        description: 'Introduction to LED control',
        masteryScore: 85,
        retentionScore: 0.9,
        reviewUrgency: 5,
        forgettingRisk: 10,
        prerequisites: [],
        dependents: ['c2'],
        state: 'MASTERED',
      },
      {
        id: 'c2',
        key: 'pwm-advanced',
        title: 'PWM Control - Advanced Optimization',
        description: 'Pulse width modulation algorithms and optimization',
        masteryScore: 30,
        retentionScore: 0.4,
        reviewUrgency: 80,
        forgettingRisk: 70,
        prerequisites: ['c1'],
        dependents: [],
        state: 'PRACTICING',
      },
    ];

    mockGraph = {
      nodes,
      edges: [],
      weakConcepts: ['pwm-advanced'],
      strongConcepts: ['led-basics'],
      highRiskConcepts: [],
      learningDna: {},
    };

    mockLearningDna = {
      id: 'dna_1',
      user_id: 'user_1',
      traits: {
        preferred_style: 'visual',
        prefers_projects: true,
        prefers_theory: false,
      },
    };
  });

  it('estimates difficulty for simple concept', () => {
    const estimate = difficultyPredictorService.estimateConceptDifficulty('c1', mockGraph, mockLearningDna);
    expect(estimate.difficultyScore).toBeLessThan(50);
    expect(estimate.recommendedDifficulty).toBe('hard'); // mastery > 70
    expect(estimate.estimatedHoursToMastery).toBeGreaterThan(0);
  });

  it('estimates difficulty for complex concept', () => {
    const estimate = difficultyPredictorService.estimateConceptDifficulty('c2', mockGraph, mockLearningDna);
    expect(estimate.difficultyScore).toBeGreaterThanOrEqual(50);
    expect(estimate.factors.prerequisiteDifficulty).toBeGreaterThanOrEqual(0);
    expect(estimate.estimatedHoursToMastery).toBeGreaterThanOrEqual(2);
  });

  it('incorporates learning style preference', () => {
    const estimate1 = difficultyPredictorService.estimateConceptDifficulty('c1', mockGraph, mockLearningDna);

    // With DNA should have acceptable preference match
    expect(estimate1.factors.userPreferenceMatch).toBeGreaterThanOrEqual(50);
  });

  it('handles missing node gracefully', () => {
    const estimate = difficultyPredictorService.estimateConceptDifficulty('nonexistent', mockGraph);
    expect(estimate.conceptId).toBe('nonexistent');
    expect(estimate.difficultyScore).toBe(50);
    expect(estimate.confidenceScore).toBeLessThan(50);
  });

  it('recommends appropriate difficulty level based on mastery', () => {
    // High mastery -> recommend hard
    const estimate1 = difficultyPredictorService.estimateConceptDifficulty('c1', mockGraph);
    expect(estimate1.recommendedDifficulty).toBe('hard');

    // Low mastery, high difficulty -> recommend easy
    const estimate2 = difficultyPredictorService.estimateConceptDifficulty('c2', mockGraph);
    expect(estimate2.recommendedDifficulty).toBe('normal');
  });
});

/**
 * Difficulty Predictor
 * Estimates concept difficulty based on multiple factors
 */

import type { KnowledgeGraphNode, KnowledgeGraphSnapshot } from '@/lib/services/knowledgeGraphService';
import type { LearningDNA } from '@/lib/memory/types';

export interface DifficultyEstimate {
  conceptId: string;
  difficultyScore: number; // 0-100
  factors: {
    intrinsicComplexity: number; // from metadata
    prerequisiteDifficulty: number; // avg difficulty of prereqs
    userPreferenceMatch: number; // match with learning style
    contextDifficulty: number; // based on learner's current level
    spaceComplexity: number; // how much to remember
  };
  estimatedHoursToMastery: number;
  recommendedDifficulty: 'easy' | 'normal' | 'hard';
  confidenceScore: number; // 0-100
}

export function estimateConceptDifficulty(
  conceptId: string,
  graph: KnowledgeGraphSnapshot,
  learningDna?: LearningDNA
): DifficultyEstimate {
  const node = graph.nodes.find((n) => n.id === conceptId);
  if (!node) {
    return {
      conceptId,
      difficultyScore: 50,
      factors: {
        intrinsicComplexity: 50,
        prerequisiteDifficulty: 0,
        userPreferenceMatch: 50,
        contextDifficulty: 50,
        spaceComplexity: 50,
      },
      estimatedHoursToMastery: 3,
      recommendedDifficulty: 'normal',
      confidenceScore: 20,
    };
  }

  // Factor 1: Intrinsic complexity (from title/description heuristics)
  const intrinsicComplexity = estimateIntrinsicComplexity(node);

  // Factor 2: Prerequisite difficulty
  const prerequisiteDifficulty = estimatePrerequisiteDifficulty(node, graph);

  // Factor 3: User preference match
  const userPreferenceMatch = estimatePreferenceMatch(node, learningDna);

  // Factor 4: Context difficulty (relative to learner's current level)
  const contextDifficulty = estimateContextDifficulty(node, graph);

  // Factor 5: Space complexity
  const spaceComplexity = estimateSpaceComplexity(node);

  const difficultyScore = Math.round(
    intrinsicComplexity * 0.25 +
    prerequisiteDifficulty * 0.2 +
    (100 - userPreferenceMatch) * 0.15 +
    contextDifficulty * 0.25 +
    spaceComplexity * 0.15
  );

  const estimatedHours = calculateEstimatedHours(difficultyScore, node.masteryScore);
  const recommendedDifficulty = getRecommendedDifficulty(difficultyScore, node.masteryScore);

  return {
    conceptId,
    difficultyScore: Math.max(0, Math.min(100, difficultyScore)),
    factors: {
      intrinsicComplexity,
      prerequisiteDifficulty,
      userPreferenceMatch,
      contextDifficulty,
      spaceComplexity,
    },
    estimatedHoursToMastery: estimatedHours,
    recommendedDifficulty,
    confidenceScore: 75,
  };
}

function estimateIntrinsicComplexity(node: KnowledgeGraphNode): number {
  // Heuristic: keywords in title/description
  const text = `${node.title} ${node.description || ''}`.toLowerCase();
  let complexity = 40; // base

  const complexKeywords = [
    'interrupt', 'timer', 'pwm', 'communication', 'protocol',
    'serial', 'i2c', 'spi', 'algorithm', 'optimization',
    'debugging', 'advanced', 'complex', 'sophisticated'
  ];

  const simpleKeywords = [
    'led', 'button', 'digitalWrite', 'digitalWrite', 'digital',
    'basic', 'simple', 'introduction', 'getting', 'started'
  ];

  for (const kw of complexKeywords) {
    if (text.includes(kw)) complexity += 10;
  }

  for (const kw of simpleKeywords) {
    if (text.includes(kw)) complexity -= 10;
  }

  return Math.max(20, Math.min(90, complexity));
}

function estimatePrerequisiteDifficulty(node: KnowledgeGraphNode, graph: KnowledgeGraphSnapshot): number {
  if (!node.prerequisites || node.prerequisites.length === 0) return 0;

  const prereqNodes = graph.nodes.filter((n) => node.prerequisites?.includes(n.id));
  const avgDifficulty = prereqNodes.length === 0
    ? 0
    : prereqNodes.reduce((sum, n) => sum + (100 - n.masteryScore), 0) / prereqNodes.length;

  // Higher prerequisite difficulty adds to overall difficulty
  return Math.round(Math.min(100, avgDifficulty * 0.8));
}

function estimatePreferenceMatch(node: KnowledgeGraphNode, learningDna?: LearningDNA): number {
  if (!learningDna?.traits) return 50;

  const traits = learningDna.traits;
  let match = 50;

  // Match based on learning style preferences
  if (traits.preferred_style === 'visual' && isVisualConcept(node)) match += 15;
  if (traits.preferred_style === 'textual' && isTextualConcept(node)) match += 15;
  if (traits.prefers_projects && isProjectRelated(node)) match += 10;
  if (traits.prefers_theory && isTheoretical(node)) match += 10;

  return Math.max(30, Math.min(100, match));
}

function estimateContextDifficulty(node: KnowledgeGraphNode, graph: KnowledgeGraphSnapshot): number {
  const allMasteries = graph.nodes.map((n) => n.masteryScore);
  const avgMastery = allMasteries.length === 0 ? 50 : allMasteries.reduce((a, b) => a + b, 0) / allMasteries.length;

  // If concept is significantly harder than learner's average, increase context difficulty
  const gap = Math.max(0, 100 - node.masteryScore - avgMastery);
  return Math.min(100, 50 + gap * 0.3);
}

function estimateSpaceComplexity(node: KnowledgeGraphNode): number {
  // How much needs to be remembered
  const description = node.description || '';
  const conceptCount = (description.match(/(\w+)/g) || []).length / 10; // rough estimate
  return Math.min(100, 40 + conceptCount * 5);
}

function calculateEstimatedHours(difficulty: number, currentMastery: number): number {
  const baseHours = difficulty > 70 ? 5 : difficulty > 50 ? 3 : 2;
  const masteryGap = Math.max(0, 100 - currentMastery) / 100;
  return Math.round(baseHours * (1 + masteryGap * 0.5) * 10) / 10;
}

function getRecommendedDifficulty(difficulty: number, masteryScore: number): 'easy' | 'normal' | 'hard' {
  if (masteryScore > 70) return 'hard';
  if (difficulty < 40) return 'easy';
  if (difficulty < 65) return 'normal';
  if (masteryScore < 30) return 'easy';
  return 'normal';
}

function isVisualConcept(node: KnowledgeGraphNode): boolean {
  const text = `${node.title} ${node.description || ''}`.toLowerCase();
  return text.includes('circuit') || text.includes('diagram') || text.includes('visual');
}

function isTextualConcept(node: KnowledgeGraphNode): boolean {
  const text = `${node.title} ${node.description || ''}`.toLowerCase();
  return text.includes('protocol') || text.includes('theory') || text.includes('concept');
}

function isProjectRelated(node: KnowledgeGraphNode): boolean {
  const text = `${node.title} ${node.description || ''}`.toLowerCase();
  return text.includes('project') || text.includes('mission') || text.includes('build');
}

function isTheoretical(node: KnowledgeGraphNode): boolean {
  const text = `${node.title} ${node.description || ''}`.toLowerCase();
  return text.includes('theory') || text.includes('principle') || text.includes('concept');
}

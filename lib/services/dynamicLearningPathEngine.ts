/**
 * Dynamic Learning Path Engine
 * Orchestrates path generation with all components
 */

import * as knowledgeGraphService from '@/lib/services/knowledgeGraphService';
import * as prerequisiteResolverService from '@/lib/services/prerequisiteResolverService';
import * as difficultyPredictorService from '@/lib/services/difficultyPredictorService';
import * as learningPathRepo from '@/lib/repos/learningPathRepo';
import * as learningDnaRepo from '@/lib/repos/learningDnaRepo';
import { defaultPublisher, makeEvent } from '@/lib/events';
import type {
  LearningPath,
  PathNode,
  PathGenerationRequest,
  PathGenerationResult,
  ProgressEstimate,
} from '@/lib/pathGeneration/types';

export async function generateAdaptivePath(request: PathGenerationRequest): Promise<PathGenerationResult> {
  // Load graph, DNA, and build dependency graph
  const [graph, learningDna] = await Promise.all([
    knowledgeGraphService.getKnowledgeGraph(request.userId),
    learningDnaRepo.getLearningDNA(request.userId).catch(() => null),
  ]);

  const depGraph = await prerequisiteResolverService.buildDependencyGraph(request.userId);

  // Detect cycles and warn
  const cycles = prerequisiteResolverService.detectCycles(depGraph);
  if (cycles.length > 0) {
    console.warn(`[PathEngine] Detected ${cycles.length} cycles in dependency graph`);
  }

  // Generate candidate nodes
  let candidateConcepts = graph.nodes;

  // If target specified, focus on path to target
  if (request.targetConcept) {
    const targetNode = graph.nodes.find((n) => n.key === request.targetConcept || n.id === request.targetConcept);
    if (!targetNode) {
      throw new Error(`Target concept ${request.targetConcept} not found`);
    }
    candidateConcepts = filterTowardsTarget(targetNode, graph, depGraph);
  }

  // Filter by readiness and blockers
  const readyNodes = candidateConcepts.filter((node) => {
    const hasMetPrereqs = prerequisiteResolverService.hasAllPrerequisitesMet(node.id, 50, depGraph);
    return hasMetPrereqs && node.masteryScore < 85;
  });

  // Score and sort candidates
  const scoredNodes: Array<{
    node: any;
    score: number;
    difficulty: any;
  }> = [];

  for (const node of readyNodes) {
    const difficulty = difficultyPredictorService.estimateConceptDifficulty(
      node.id,
      graph,
      learningDna || undefined
    );

    const blockers = prerequisiteResolverService.findBlockingConcepts(node.id, depGraph);
    const baseScore = node.forgettingRisk * 0.4 + (100 - node.masteryScore) * 0.3 + node.reviewUrgency * 0.2 - blockers.length * 5;

    // Adjust by learning style preference
    const styleBoost = difficultyPredictorService.estimateConceptDifficulty(node.id, graph, learningDna || undefined)
      .factors.userPreferenceMatch;

    scoredNodes.push({
      node,
      score: baseScore + styleBoost * 0.1,
      difficulty,
    });
  }

  scoredNodes.sort((a, b) => b.score - a.score);

  // Build path nodes with sequence
  const pathNodes: PathNode[] = [];
  let estimatedMinutes = 0;
  let sequenceNumber = 0;

  const maxNodes = Math.min(
    request.availableMinutes ? Math.ceil(request.availableMinutes / 15) : 20,
    scoredNodes.length
  );

  for (let i = 0; i < maxNodes; i++) {
    const scored = scoredNodes[i];
    const blockers = prerequisiteResolverService.findBlockingConcepts(scored.node.id, depGraph);

    const pathNode: PathNode = {
      conceptId: scored.node.id,
      conceptKey: scored.node.key,
      title: scored.node.title,
      sequenceNumber,
      difficulty: scored.difficulty.difficultyScore,
      estimatedMinutes: Math.round(scored.difficulty.estimatedHoursToMastery * 60),
      masteryRequired: 70,
      prerequisites: scored.node.prerequisites || [],
      readiness: Math.min(100, Math.max(0, 50 + scored.score)),
      blockers: blockers.map((b) => b.conceptId),
      reasons: [
        `Urgency: ${scored.node.reviewUrgency}`,
        `Forgetting risk: ${scored.node.forgettingRisk}%`,
        `Style match: ${scored.difficulty.factors.userPreferenceMatch}%`,
      ],
    };

    pathNodes.push(pathNode);
    estimatedMinutes += pathNode.estimatedMinutes;
    sequenceNumber++;
  }

  // Create path object
  const path: LearningPath = {
    id: `path_${request.userId}_${Date.now()}`,
    userId: request.userId,
    goal: request.targetConcept || request.difficultyLevel,
    createdAt: new Date().toISOString(),
    estimatedTotalMinutes: estimatedMinutes,
    currentNodeIndex: 0,
    nodes: pathNodes,
    metadata: {
      learningStyle: learningDna?.traits?.preferred_style || 'unknown',
      difficultyProgression: request.difficultyLevel === 'hard' ? 'aggressive' : request.difficultyLevel === 'easy' ? 'gentle' : 'standard',
      preferredSessionLength: request.availableMinutes || 30,
      targetDate: request.availableMinutes ? new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString() : undefined,
      confidenceScore: Math.min(100, 60 + (graph.nodes.length / 50) * 20),
    },
  };

  // Persist path
  await learningPathRepo.createLearningPath(path);

  // Publish event
  await defaultPublisher.publish(
    makeEvent({
      name: 'LearningPathGenerated',
      version: 1,
      source: 'pathgeneration',
      userId: request.userId,
      payload: {
        pathId: path.id,
        nodeCount: pathNodes.length,
        estimatedMinutes,
        targetConcept: request.targetConcept,
      },
    })
  );

  return {
    path,
    explanation: `Generated adaptive path with ${pathNodes.length} concepts over ~${Math.round(estimatedMinutes / 60)}h. Personalized for ${learningDna?.traits?.preferred_style || 'mixed'} learning style.`,
    confidence: path.metadata.confidenceScore,
  };
}

export async function getNextConcepts(userId: string, count: number = 5): Promise<PathNode[]> {
  const currentPath = await learningPathRepo.getCurrentLearningPath(userId);
  if (!currentPath) {
    return [];
  }

  const nextNodes = currentPath.nodes.slice(currentPath.currentNodeIndex, currentPath.currentNodeIndex + count);
  return nextNodes;
}

export async function estimateProgress(userId: string, conceptId: string): Promise<ProgressEstimate> {
  const graph = await knowledgeGraphService.getKnowledgeGraph(userId);
  const node = graph.nodes.find((n) => n.id === conceptId);

  if (!node) {
    throw new Error(`Concept ${conceptId} not found`);
  }

  // Simple prediction: based on forgetting curve
  const predictedMastery7d = Math.max(node.masteryScore - node.forgettingRisk * 0.15, 0);
  const predictedMastery30d = Math.max(node.masteryScore - node.forgettingRisk * 0.5, 0);

  const daysToMastery = node.masteryScore >= 80
    ? 0
    : Math.ceil((80 - node.masteryScore) / (100 / 30)); // rough estimate

  return {
    conceptId,
    currentMastery: node.masteryScore,
    predictedMastery7d: Math.round(predictedMastery7d),
    predictedMastery30d: Math.round(predictedMastery30d),
    daysToMastery: Math.max(1, daysToMastery),
    riskOfRegression: node.forgettingRisk,
    recommendedReviewIntervals: [1, 3, 7, 14, 30],
  };
}

function filterTowardsTarget(
  targetNode: any,
  graph: any,
  depGraph: any
): any[] {
  // Include target and all nodes leading to it
  const relevant = new Set<string>();
  relevant.add(targetNode.id);

  // Add all prerequisites
  const allPrereqs = prerequisiteResolverService.getTransitivePrerequisites(targetNode.id, depGraph);
  for (const prereq of allPrereqs) {
    relevant.add(prereq);
  }

  // Add dependent for context (optional)
  const directDeps = prerequisiteResolverService.getDirectDependents(targetNode.id, depGraph);
  for (const dep of directDeps) {
    relevant.add(dep);
  }

  return graph.nodes.filter((n: any) => relevant.has(n.id));
}

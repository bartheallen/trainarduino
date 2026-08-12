import * as conceptRepo from '@/lib/repos/conceptRepo';
import * as stateRepo from '@/lib/repos/conceptStateRepo';
import * as dnaRepo from '@/lib/repos/learningDnaRepo';
import type { ConceptStateRow, KnowledgeConcept } from '@/lib/memory/types';

export interface KnowledgeGraphNode extends KnowledgeConcept {
  prerequisites: string[];
  dependents: string[];
  state?: ConceptStateRow['state'];
  masteryScore: number;
  retentionScore: number;
  reviewUrgency: number;
  forgettingRisk: number;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: 'prerequisite' | 'dependent';
}

export interface KnowledgeGraphSnapshot {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  weakConcepts: string[];
  strongConcepts: string[];
  highRiskConcepts: string[];
  learningDna: Record<string, any>;
}

export interface LearningPathStep {
  conceptId: string;
  key: string;
  title: string;
  masteryScore: number;
  readiness: number;
  blockers: string[];
}

export interface WeakConceptSubgraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export interface ConceptPriority {
  conceptId: string;
  key: string;
  priorityScore: number;
  masteryScore: number;
  forgettingRisk: number;
  reviewUrgency: number;
  blockingCount: number;
}

export function computeForgettingRisk(state?: ConceptStateRow): number {
  if (!state) return 0;
  const retention = Math.max(0, Math.min(1, state.retention_score ?? 1));
  const urgency = state.review_urgency ?? 0;
  const dateScore = state.predicted_forget_date
    ? Math.max(0, Math.min(100, 100 - ((new Date(state.predicted_forget_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) * 5))
    : 0;
  return Math.round(Math.max(0, Math.min(100, (1 - retention) * 100 * 0.7 + urgency * 0.2 + dateScore * 0.1)));
}

export function buildKnowledgeGraphSnapshot(
  concepts: KnowledgeConcept[],
  states: ConceptStateRow[],
  dependencies: Record<string, string[]>,
  dependents: Record<string, string[]>,
  learningDna: Record<string, any> = {}
): KnowledgeGraphSnapshot {
  const nodes: KnowledgeGraphNode[] = concepts.map((concept) => {
    const state = states.find((item) => item.concept_id === concept.id);
    const masteryScore = state?.mastery_score ?? 0;
    const retentionScore = state?.retention_score ?? 1;
    const reviewUrgency = state?.review_urgency ?? 0;
    return {
      ...concept,
      prerequisites: dependencies[concept.id] ?? [],
      dependents: dependents[concept.id] ?? [],
      state: state?.state,
      masteryScore,
      retentionScore,
      reviewUrgency,
      forgettingRisk: computeForgettingRisk(state),
    };
  });

  const edges: KnowledgeGraphEdge[] = [];
  for (const concept of concepts) {
    const prereqs = dependencies[concept.id] ?? [];
    for (const prerequisiteId of prereqs) {
      edges.push({ source: prerequisiteId, target: concept.id, type: 'prerequisite' });
    }
    const deps = dependents[concept.id] ?? [];
    for (const dependentId of deps) {
      edges.push({ source: concept.id, target: dependentId, type: 'dependent' });
    }
  }

  const weakConcepts = nodes.filter((node) => node.masteryScore < 50).map((node) => node.key);
  const strongConcepts = nodes.filter((node) => node.masteryScore >= 80).map((node) => node.key);
  const highRiskConcepts = nodes.filter((node) => node.forgettingRisk >= 60).map((node) => node.key);

  return {
    nodes,
    edges,
    weakConcepts,
    strongConcepts,
    highRiskConcepts,
    learningDna,
  };
}

export async function getKnowledgeGraph(userId: string): Promise<KnowledgeGraphSnapshot> {
  const [concepts, states, learningDna] = await Promise.all([
    conceptRepo.listConcepts().catch(() => []),
    stateRepo.listConceptStatesForUser(userId).catch(() => []),
    dnaRepo.getLearningDNA(userId).then((res) => res?.traits ?? {}).catch(() => ({})),
  ]);

  const dependencyEntries = await Promise.all(
    concepts.map(async (concept) => ({
      conceptId: concept.id,
      prerequisites: await conceptRepo.getPrerequisites(concept.id).catch(() => []),
      dependents: await conceptRepo.getDependents(concept.id).catch(() => []),
    }))
  );

  const dependencies: Record<string, string[]> = {};
  const dependents: Record<string, string[]> = {};
  for (const entry of dependencyEntries) {
    dependencies[entry.conceptId] = entry.prerequisites;
    dependents[entry.conceptId] = entry.dependents;
  }

  return buildKnowledgeGraphSnapshot(concepts, states, dependencies, dependents, learningDna);
}

export async function getPrerequisites(conceptId: string): Promise<string[]> {
  return await conceptRepo.getPrerequisites(conceptId).catch(() => []);
}

export async function getDependents(conceptId: string): Promise<string[]> {
  return await conceptRepo.getDependents(conceptId).catch(() => []);
}

export async function findBlockingConcepts(userId: string, conceptId: string): Promise<string[]> {
  const graph = await getKnowledgeGraph(userId);
  const target = graph.nodes.find((node) => node.id === conceptId);
  if (!target) return [];

  const blockers: string[] = [];
  const visited = new Set<string>();
  const stack = [...(target.prerequisites ?? [])];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    const current = graph.nodes.find((node) => node.id === currentId);
    if (!current) continue;
    if (current.masteryScore < 70) {
      blockers.push(current.key);
    }
    stack.push(...(current.prerequisites ?? []));
  }

  return Array.from(new Set(blockers));
}

export function computeConceptPriority(
  graph: KnowledgeGraphSnapshot,
  conceptId: string
): ConceptPriority | null {
  const node = graph.nodes.find((item) => item.id === conceptId);
  if (!node) return null;

  const blockingCount = node.prerequisites.filter((pid) => {
    const prereq = graph.nodes.find((item) => item.id === pid);
    return prereq ? prereq.masteryScore < 70 : true;
  }).length;

  const priorityScore = Math.round(
    (100 - node.masteryScore) * 0.5 +
    node.forgettingRisk * 0.3 +
    node.reviewUrgency * 0.1 +
    blockingCount * 5
  );

  return {
    conceptId: node.id,
    key: node.key,
    priorityScore,
    masteryScore: node.masteryScore,
    forgettingRisk: node.forgettingRisk,
    reviewUrgency: node.reviewUrgency,
    blockingCount,
  };
}

export async function getLearningPath(userId: string, targetConceptId: string, limit = 10): Promise<LearningPathStep[]> {
  const graph = await getKnowledgeGraph(userId);
  const target = graph.nodes.find((node) => node.id === targetConceptId);
  if (!target) return [];

  const path: LearningPathStep[] = [];
  const visited = new Set<string>();
  const stack = [...target.prerequisites];

  while (stack.length > 0 && path.length < limit) {
    const currentId = stack.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);
    const currentNode = graph.nodes.find((node) => node.id === currentId);
    if (!currentNode) continue;

    const blockers = currentNode.prerequisites.filter((pid) => {
      const prereq = graph.nodes.find((node) => node.id === pid);
      return prereq ? prereq.masteryScore < 70 : true;
    });

    const readiness = Math.round(
      Math.max(0, Math.min(100, currentNode.masteryScore * 0.7 + (100 - currentNode.forgettingRisk) * 0.2 + (100 - currentNode.reviewUrgency) * 0.1))
    );

    path.push({
      conceptId: currentNode.id,
      key: currentNode.key,
      title: currentNode.title,
      masteryScore: currentNode.masteryScore,
      readiness,
      blockers,
    });

    stack.unshift(...currentNode.prerequisites.filter((id) => !visited.has(id)));
  }

  path.sort((a, b) => a.readiness - b.readiness || a.masteryScore - b.masteryScore);
  return path;
}

export async function getWeakConceptSubgraph(userId: string): Promise<WeakConceptSubgraph> {
  const graph = await getKnowledgeGraph(userId);
  const weakIds = new Set(graph.nodes.filter((node) => node.masteryScore < 50).map((node) => node.id));
  const nodes = graph.nodes.filter((node) => weakIds.has(node.id) || node.prerequisites.some((pid) => weakIds.has(pid)) || node.dependents.some((did) => weakIds.has(did)));
  const edges = graph.edges.filter((edge) => weakIds.has(edge.source) || weakIds.has(edge.target));
  return { nodes, edges };
}

export async function suggestNextConcepts(userId: string, limit = 5): Promise<string[]> {
  const graph = await getKnowledgeGraph(userId).catch(() => ({ nodes: [], edges: [], weakConcepts: [], strongConcepts: [], highRiskConcepts: [], learningDna: {} }));
  const candidates = graph.nodes
    .filter((node) => node.masteryScore < 80)
    .sort((a, b) => {
      const scoreA = (a.forgettingRisk * 0.6) + (50 - a.masteryScore) * 0.4 + (a.reviewUrgency || 0) * 0.2;
      const scoreB = (b.forgettingRisk * 0.6) + (50 - b.masteryScore) * 0.4 + (b.reviewUrgency || 0) * 0.2;
      return scoreB - scoreA;
    })
    .slice(0, limit)
    .map((node) => node.key);
  return candidates;
}

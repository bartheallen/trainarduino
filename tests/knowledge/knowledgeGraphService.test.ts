import { beforeEach, describe, it, expect, vi } from 'vitest';
import * as stateRepo from '@/lib/repos/conceptStateRepo';
import * as conceptRepo from '@/lib/repos/conceptRepo';
import * as dnaRepo from '@/lib/repos/learningDnaRepo';
import {
  getKnowledgeGraph,
  buildKnowledgeGraphSnapshot,
  suggestNextConcepts,
  getWeakConceptSubgraph,
  getLearningPath,
} from '@/lib/services/knowledgeGraphService';

vi.mock('@/lib/repos/conceptRepo');
vi.mock('@/lib/repos/conceptStateRepo');
vi.mock('@/lib/repos/learningDnaRepo');

describe('KnowledgeGraphService', () => {
  const concepts = [
    { id: 'c1', key: 'digital-input', title: 'Digital Input', description: 'Entrée numérique' },
    { id: 'c2', key: 'digital-output', title: 'Digital Output', description: 'Sortie numérique' },
  ];

  beforeEach(() => {
    (conceptRepo.listConcepts as any).mockResolvedValue(concepts);
    (conceptRepo.getPrerequisites as any).mockImplementation(async (id: string) => (id === 'c2' ? ['c1'] : []));
    (conceptRepo.getDependents as any).mockImplementation(async (id: string) => (id === 'c1' ? ['c2'] : []));
    (stateRepo.listConceptStatesForUser as any).mockResolvedValue([
      { id: 's1', user_id: 'u1', concept_id: 'c1', state: 'MASTERED', mastery_score: 90, retention_score: 0.9, review_urgency: 10 },
      { id: 's2', user_id: 'u1', concept_id: 'c2', state: 'PRACTICING', mastery_score: 40, retention_score: 0.6, review_urgency: 70 },
    ]);
    (dnaRepo.getLearningDNA as any).mockResolvedValue({ traits: { preferred_style: 'visual' } });
  });

  it('builds a graph snapshot with prerequisites and forgetting risk', async () => {
    const graph = await getKnowledgeGraph('u1');

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.find((node) => node.key === 'digital-output')?.prerequisites).toEqual(['c1']);
    expect(graph.nodes.find((node) => node.key === 'digital-input')?.dependents).toEqual(['c2']);
    expect(graph.highRiskConcepts).toContain('digital-output');
    expect(graph.learningDna).toEqual({ preferred_style: 'visual' });
  });

  it('suggests next concepts based on mastery and forgetting risk', async () => {
    const next = await suggestNextConcepts('u1', 1);
    expect(next).toEqual(['digital-output']);
  });

  it('builds a snapshot from raw state data', () => {
    const snapshot = buildKnowledgeGraphSnapshot(
      concepts,
      [
        { id: 's1', user_id: 'u1', concept_id: 'c1', state: 'MASTERED', mastery_score: 90, retention_score: 0.9, review_urgency: 10 },
      ],
      { c1: [], c2: ['c1'] },
      { c1: ['c2'], c2: [] },
      { arrival: true }
    );

    expect(snapshot.nodes[0].masteryScore).toBe(90);
    expect(snapshot.edges.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.learningDna).toEqual({ arrival: true });
  });

  it('returns a weak concept subgraph based on graph state', async () => {
    const subgraph = await getWeakConceptSubgraph('u1');
    expect(subgraph.nodes).toEqual(expect.any(Array));
    expect(subgraph.edges).toEqual(expect.any(Array));
  });

  it('builds a learning path for a target concept', async () => {
    const path = await getLearningPath('u1', 'c2', 3);
    expect(Array.isArray(path)).toBe(true);
    expect(path.every((step) => typeof step.readiness === 'number')).toBe(true);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import * as prerequisiteResolverService from '@/lib/services/prerequisiteResolverService';
import type { DependencyGraph } from '@/lib/pathGeneration/types';

describe('PrerequisiteResolverService', () => {
  let mockGraph: { nodes: any[]; edges: any; reverseEdges: any };
  let depGraph: DependencyGraph;

  beforeEach(() => {
    mockGraph = {
      nodes: [
        { id: 'c1', key: 'digital-io', title: 'Digital I/O', masteryScore: 90 },
        { id: 'c2', key: 'pwm', title: 'PWM', masteryScore: 50, prerequisites: ['c1'] },
        { id: 'c3', key: 'interrupts', title: 'Interrupts', masteryScore: 20, prerequisites: ['c1', 'c2'] },
        { id: 'c4', key: 'timers', title: 'Timers', masteryScore: 0, prerequisites: ['c2'] },
      ],
      edges: new Map([
        ['c1', []],
        ['c2', ['c1']],
        ['c3', ['c1', 'c2']],
        ['c4', ['c2']],
      ]),
      reverseEdges: new Map([
        ['c1', ['c2', 'c3']],
        ['c2', ['c3', 'c4']],
        ['c3', []],
        ['c4', []],
      ]),
    };

    depGraph = {
      nodes: new Map([
        ['c1', { concept: mockGraph.nodes[0], mastery: 90 }],
        ['c2', { concept: mockGraph.nodes[1], mastery: 50 }],
        ['c3', { concept: mockGraph.nodes[2], mastery: 20 }],
        ['c4', { concept: mockGraph.nodes[3], mastery: 0 }],
      ]),
      edges: mockGraph.edges,
      reverseEdges: mockGraph.reverseEdges,
    };
  });

  it('identifies direct prerequisites', () => {
    expect(prerequisiteResolverService.getDirectPrerequisites('c2', depGraph)).toEqual(['c1']);
    expect(prerequisiteResolverService.getDirectPrerequisites('c3', depGraph)).toEqual(['c1', 'c2']);
    expect(prerequisiteResolverService.getDirectPrerequisites('c1', depGraph)).toEqual([]);
  });

  it('identifies direct dependents', () => {
    expect(prerequisiteResolverService.getDirectDependents('c1', depGraph)).toEqual(['c2', 'c3']);
    expect(prerequisiteResolverService.getDirectDependents('c2', depGraph)).toEqual(['c3', 'c4']);
    expect(prerequisiteResolverService.getDirectDependents('c3', depGraph)).toEqual([]);
  });

  it('computes transitive prerequisites', () => {
    const prereqs = prerequisiteResolverService.getTransitivePrerequisites('c3', depGraph);
    expect(prereqs).toContain('c1');
    expect(prereqs).toContain('c2');
    expect(prereqs).not.toContain('c3');
  });

  it('computes transitive dependents', () => {
    const deps = prerequisiteResolverService.getTransitiveDependents('c1', depGraph);
    expect(deps).toContain('c2');
    expect(deps).toContain('c3');
    expect(deps).toContain('c4');
  });

  it('identifies blocking concepts', () => {
    const blockers = prerequisiteResolverService.findBlockingConcepts('c4', depGraph);
    expect(blockers.some((b) => b.conceptId === 'c2')).toBe(true);
    expect(blockers.every((b) => depGraph.nodes.get(b.conceptId)!.mastery < 70)).toBe(true);
  });

  it('checks if all prerequisites are met', () => {
    expect(prerequisiteResolverService.hasAllPrerequisitesMet('c2', 70, depGraph)).toBe(true);
    expect(prerequisiteResolverService.hasAllPrerequisitesMet('c3', 70, depGraph)).toBe(false); // c2 < 70
    expect(prerequisiteResolverService.hasAllPrerequisitesMet('c4', 70, depGraph)).toBe(false); // c2 < 70
  });

  it('detects cycles in dependency graph', () => {
    // Create cyclic graph
    const cyclicGraph: DependencyGraph = {
      nodes: new Map([
        ['c1', { concept: mockGraph.nodes[0], mastery: 50 }],
        ['c2', { concept: mockGraph.nodes[1], mastery: 50 }],
      ]),
      edges: new Map([
        ['c1', ['c2']],
        ['c2', ['c1']],
      ]),
      reverseEdges: new Map([
        ['c1', ['c2']],
        ['c2', ['c1']],
      ]),
    };

    const cycles = prerequisiteResolverService.detectCycles(cyclicGraph);
    expect(cycles.length).toBeGreaterThan(0);
  });
});

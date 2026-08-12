/**
 * Prerequisite Resolver
 * Resolves dependency chains and identifies blocking concepts
 */

import * as knowledgeGraphService from '@/lib/services/knowledgeGraphService';
import type { DependencyGraph } from '@/lib/pathGeneration/types';

export async function buildDependencyGraph(userId: string): Promise<DependencyGraph> {
  const graph = await knowledgeGraphService.getKnowledgeGraph(userId);
  
  const nodes = new Map<string, { concept: any; mastery: number }>();
  const edges = new Map<string, string[]>();
  const reverseEdges = new Map<string, string[]>();

  for (const node of graph.nodes) {
    nodes.set(node.id, { concept: node, mastery: node.masteryScore });
    edges.set(node.id, node.prerequisites || []);
    reverseEdges.set(node.id, node.dependents || []);
  }

  return { nodes, edges, reverseEdges };
}

export function getDirectPrerequisites(conceptId: string, graph: DependencyGraph): string[] {
  return graph.edges.get(conceptId) || [];
}

export function getDirectDependents(conceptId: string, graph: DependencyGraph): string[] {
  return graph.reverseEdges.get(conceptId) || [];
}

export function getTransitivePrerequisites(conceptId: string, graph: DependencyGraph): Set<string> {
  const visited = new Set<string>();
  const stack = [conceptId];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const prereqs = getDirectPrerequisites(current, graph);
    for (const prereq of prereqs) {
      if (!visited.has(prereq)) stack.push(prereq);
    }
  }

  visited.delete(conceptId);
  return visited;
}

export function getTransitiveDependents(conceptId: string, graph: DependencyGraph): Set<string> {
  const visited = new Set<string>();
  const stack = [conceptId];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const dependents = getDirectDependents(current, graph);
    for (const dependent of dependents) {
      if (!visited.has(dependent)) stack.push(dependent);
    }
  }

  visited.delete(conceptId);
  return visited;
}

export function findBlockingConcepts(
  targetConceptId: string,
  graph: DependencyGraph
): { conceptId: string; masteryRequired: number; unlocksCount: number }[] {
  const prereqs = getTransitivePrerequisites(targetConceptId, graph);
  const blockers: { conceptId: string; masteryRequired: number; unlocksCount: number }[] = [];

  for (const prereqId of prereqs) {
    const node = graph.nodes.get(prereqId);
    if (!node) continue;

    // Only consider as blocker if not yet mastered
    if (node.mastery < 70) {
      const unlocksCount = getDirectDependents(prereqId, graph).length;
      blockers.push({
        conceptId: prereqId,
        masteryRequired: Math.max(70, 100 - node.mastery),
        unlocksCount,
      });
    }
  }

  // Sort by impact (unlocksCount) and mastery gap
  blockers.sort((a, b) => {
    const impactDiff = b.unlocksCount - a.unlocksCount;
    if (impactDiff !== 0) return impactDiff;
    return b.masteryRequired - a.masteryRequired;
  });

  return blockers;
}

export function hasAllPrerequisitesMet(
  conceptId: string,
  threshold: number,
  graph: DependencyGraph
): boolean {
  const prereqs = getDirectPrerequisites(conceptId, graph);
  for (const prereqId of prereqs) {
    const node = graph.nodes.get(prereqId);
    if (!node || node.mastery < threshold) return false;
  }
  return true;
}

export function resolvePath(
  startConceptId: string,
  targetConceptId: string,
  graph: DependencyGraph
): string[] {
  // BFS to find shortest path of dependencies
  const queue: Array<{ node: string; path: string[] }> = [{ node: startConceptId, path: [startConceptId] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { node: current, path } = queue.shift()!;

    if (current === targetConceptId) {
      return path;
    }

    if (visited.has(current)) continue;
    visited.add(current);

    const deps = getDirectDependents(current, graph);
    for (const dep of deps) {
      if (!visited.has(dep)) {
        queue.push({ node: dep, path: [...path, dep] });
      }
    }
  }

  return [];
}

export function detectCycles(graph: DependencyGraph): string[][] {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const deps = getDirectPrerequisites(node, graph);
    for (const dep of deps) {
      if (!visited.has(dep)) {
        dfs(dep, [...path]);
      } else if (recStack.has(dep)) {
        const cycleStart = path.indexOf(dep);
        if (cycleStart >= 0) {
          cycles.push([...path.slice(cycleStart), dep]);
        }
      }
    }

    recStack.delete(node);
  }

  for (const node of graph.nodes.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

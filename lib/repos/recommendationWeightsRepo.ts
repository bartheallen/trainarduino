import { createServerSupabaseClient } from '@/lib/supabase';
import type { RecommendationWeight } from '@/lib/types';

const memoryWeights: RecommendationWeight[] = [];

async function getSupabaseOrNull() {
  try {
    return await createServerSupabaseClient();
  } catch {
    return null;
  }
}

export async function upsertWeight(weight: Partial<RecommendationWeight>) {
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const existing = memoryWeights.find((w) => w.recommendation_id === weight.recommendation_id);
    if (existing) {
      Object.assign(existing, weight, { updated_at: new Date().toISOString() });
      return existing;
    }
    const entry = {
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      value: weight.value ?? 0,
      recommendation_id: weight.recommendation_id ?? null,
      concept: weight.concept ?? null,
      updated_at: new Date().toISOString(),
    } as RecommendationWeight;
    memoryWeights.push(entry);
    return entry;
  }

  const { data, error } = await supabase.from('recommendation_weights').upsert([weight], { onConflict: 'recommendation_id,concept' }).select().single();
  if (error) throw error;
  return data as RecommendationWeight;
}

export async function listWeightsForUser() {
  // weights are global per recommendation or concept; in future may be per-user
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return memoryWeights.slice();
  }

  const { data, error } = await supabase.from('recommendation_weights').select('*');
  if (error) return [] as RecommendationWeight[];
  return data as RecommendationWeight[];
}

export async function getWeightByRecommendationId(recommendationId: string) {
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return memoryWeights.find((w) => w.recommendation_id === recommendationId) || null;
  }
  const { data, error } = await supabase.from('recommendation_weights').select('*').eq('recommendation_id', recommendationId).single();
  if (error) return null;
  return data as RecommendationWeight;
}

export async function listWeightsByConcept(concept: string) {
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return memoryWeights.filter((w) => w.concept === concept);
  }
  const { data, error } = await supabase.from('recommendation_weights').select('*').eq('concept', concept);
  if (error) return [] as RecommendationWeight[];
  return data as RecommendationWeight[];
}

// named exports are declared on each function above

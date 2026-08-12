import { createServerSupabaseClient as createServerClient } from '@/lib/supabase';
import type { MemoryEvent } from '@/lib/memory/types';
import { makeEvent } from '@/lib/events/utils';
import { defaultPublisher } from '@/lib/events/publisher';

export async function emitEvent(event: Omit<MemoryEvent, 'id' | 'created_at'>) {
  // Normalize into a full EventEnvelope and publish so subscribers can react
  const envelope = makeEvent({ name: event.event_type, version: 1, source: 'memory', userId: event.user_id ?? null, payload: { concept_id: event.concept_id, ...event.payload } });
  try {
    await defaultPublisher.publish(envelope as any);
  } catch (e) {
    console.error('memoryEventsRepo.emitEvent: publish failed', e);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.from('memory_events').insert([{ id: envelope.id, user_id: envelope.userId, concept_id: event.concept_id, event_type: envelope.name, payload: envelope }]).select().single();
  if (error) throw new Error(`emitEvent failed: ${error.message}`);
  return data as MemoryEvent;
}

export async function listEventsForUser(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from('memory_events').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw new Error(`listEventsForUser failed: ${error.message}`);
  return data as MemoryEvent[];
}

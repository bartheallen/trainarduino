import { createServerSupabaseClient } from '@/lib/supabase';
import { makeEvent } from '@/lib/events/utils';
import { defaultPublisher } from '@/lib/events/publisher';

/**
 * Persist a domain event to the events table and publish it on the in-memory EventBus.
 * This ensures events have standard metadata (id, timestamp, correlationId, causationId).
 */
export async function emitEvent(userId: string | null, type: string, payload: Record<string, any> = {}, opts: { correlationId?: string; causationId?: string; source?: string } = {}) {
  const event = makeEvent({ name: type, version: 1, source: opts.source ?? 'repo', userId, causationId: opts.causationId, correlationId: opts.correlationId, payload });

  // publish to in-memory bus so subscribers react immediately
  try {
    await defaultPublisher.publish(event as any);
  } catch (e) {
    // continue to persist even if publish fails
    console.error('emitEvent: publish failed', e);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('events').insert([{ id: event.id, user_id: event.userId, type: event.name, payload: event }]).select().single();
  if (error) throw error;
  return data;
}

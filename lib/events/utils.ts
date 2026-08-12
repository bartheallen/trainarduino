import type { EventEnvelope } from './types';

function generateEventId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeEvent<T = any>(event: Partial<EventEnvelope<T>> & { name: string; version: number; source: string; payload: T }): EventEnvelope<T> {
  const id = event.id ?? generateEventId();
  const timestamp = event.timestamp ?? new Date().toISOString();
  const correlationId = event.correlationId ?? event.causationId ?? id;

  return {
    id,
    name: event.name,
    version: event.version,
    source: event.source,
    userId: event.userId ?? null,
    correlationId,
    causationId: event.causationId ?? null,
    payload: event.payload,
    metadata: event.metadata ?? {},
    timestamp,
  };
}

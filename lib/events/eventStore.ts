import type { EventEnvelope, EventFilter } from './types';

export class InMemoryEventStore {
  private events: EventEnvelope[] = [];

  async persist(event: EventEnvelope) {
    this.events.push(event);
    return event;
  }

  async persistMany(events: EventEnvelope[]) {
    for (const e of events) this.events.push(e);
    return events;
  }

  async load(filter?: EventFilter) {
    let result = this.events.slice();
    if (!filter) return result;
    if (filter.userId) result = result.filter((e) => e.userId === filter.userId);
    if (filter.name) result = result.filter((e) => e.name === filter.name);
    const since = filter.since;
    const until = filter.until;
    if (since) result = result.filter((e) => e.timestamp >= since);
    if (until) result = result.filter((e) => e.timestamp <= until);
    return result;
  }

  async replay(handler: (e: EventEnvelope) => Promise<void> | void, filter?: EventFilter) {
    const events = await this.load(filter);
    for (const e of events) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await handler(e);
      } catch (err) {
        // continue; caller can decide what to do
      }
    }
  }

  clear() {
    this.events = [];
  }
}

export const defaultInMemoryEventStore = new InMemoryEventStore();

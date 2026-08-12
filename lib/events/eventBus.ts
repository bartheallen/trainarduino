import { defaultInMemoryEventStore } from './eventStore';
import { defaultEventRegistry } from './registry';
import type { EventEnvelope, EventHandler, EventResult } from './types';

type SubscriberSet = Set<EventHandler>;

class EventBus {
  private store = defaultInMemoryEventStore;
  private registry = defaultEventRegistry;
  private subscribers: Map<string, SubscriberSet> = new Map();
  private deadLetterQueue: EventEnvelope[] = [];
  private metrics = {
    published: 0,
    processed: 0,
    failed: 0,
    retries: 0,
    latencyMs: 0,
  };

  publish = async (event: EventEnvelope) => {
    this.metrics.published += 1;
    await this.store.persist(event);
    const subs = this.subscribers.get(event.name) || new Set();
    const results: EventResult[] = [];
    for (const handler of subs) {
      const result = { event, handler, success: true, error: null, latencyMs: 0, retryCount: 0 } as EventResult;
      const start = Date.now();
      try {
        await Promise.resolve().then(() => handler(event));
        this.metrics.processed += 1;
      } catch (err) {
        result.success = false;
        result.error = err;
        this.metrics.failed += 1;
        await this.retryOrDeadLetter(event, handler, result);
      } finally {
        result.latencyMs = Date.now() - start;
        this.metrics.latencyMs += result.latencyMs;
        results.push(result);
      }
    }
    return { event, results };
  };

  publishMany = async (events: EventEnvelope[]) => {
    await this.store.persistMany(events);
    const aggregated = [] as Array<{ event: EventEnvelope; results: EventResult[] }>;
    for (const e of events) {
      const subs = this.subscribers.get(e.name) || new Set();
      const results: EventResult[] = [];
      for (const handler of subs) {
        const result = { event: e, handler, success: true, error: null, latencyMs: 0, retryCount: 0 } as EventResult;
        const start = Date.now();
        try {
          await Promise.resolve().then(() => handler(e));
          this.metrics.processed += 1;
        } catch (err) {
          result.success = false;
          result.error = err;
          this.metrics.failed += 1;
          await this.retryOrDeadLetter(e, handler, result);
        } finally {
          result.latencyMs = Date.now() - start;
          this.metrics.latencyMs += result.latencyMs;
          results.push(result);
        }
      }
      aggregated.push({ event: e, results });
    }
    return aggregated;
  };

  subscribe = (eventName: string, handler: EventHandler) => {
    const set = this.subscribers.get(eventName) || new Set();
    set.add(handler);
    this.subscribers.set(eventName, set);
    return () => this.unsubscribe(eventName, handler);
  };

  unsubscribe = (eventName: string, handler: EventHandler) => {
    const set = this.subscribers.get(eventName);
    if (!set) return false;
    const removed = set.delete(handler);
    if (set.size === 0) this.subscribers.delete(eventName);
    return removed;
  };

  listSubscribers(eventName?: string) {
    if (eventName) return Array.from(this.subscribers.get(eventName) || []);
    const all: Record<string, number> = {};
    for (const [k, set] of this.subscribers.entries()) all[k] = set.size;
    return all;
  }

  getStore() {
    return this.store;
  }

  getRegistry() {
    return this.registry;
  }

  getDeadLetterEvents() {
    return this.deadLetterQueue.slice();
  }

  getMetrics() {
    return { ...this.metrics };
  }

  private async retryOrDeadLetter(event: EventEnvelope, handler: EventHandler, result: EventResult) {
    result.retryCount += 1;
    if (result.retryCount <= 3) {
      this.metrics.retries += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      try {
        await Promise.resolve().then(() => handler(event));
        result.success = true;
        this.metrics.processed += 1;
      } catch (err) {
        result.error = err;
        this.deadLetterQueue.push(event);
      }
    } else {
      this.deadLetterQueue.push(event);
    }
  }
}

export const defaultEventBus = new EventBus();

export default defaultEventBus;

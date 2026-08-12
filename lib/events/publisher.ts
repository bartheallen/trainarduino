import defaultEventBus from './eventBus';
import type { EventEnvelope } from './types';

export class EventPublisher {
  private bus = defaultEventBus;

  async publish(event: EventEnvelope) {
    return this.bus.publish(event);
  }

  async publishMany(events: EventEnvelope[]) {
    return this.bus.publishMany(events);
  }
}

export const defaultPublisher = new EventPublisher();

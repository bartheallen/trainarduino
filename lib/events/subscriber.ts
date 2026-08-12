import defaultEventBus from './eventBus';
import type { EventHandler } from './types';

export class EventSubscriber {
  private bus = defaultEventBus;

  subscribe(eventName: string, handler: EventHandler) {
    return this.bus.subscribe(eventName, handler);
  }

  unsubscribe(eventName: string, handler: EventHandler) {
    return this.bus.unsubscribe(eventName, handler);
  }
}

export const defaultSubscriber = new EventSubscriber();

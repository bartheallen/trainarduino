import type { EventRegistration } from './types';

export class EventRegistry {
  private map: Map<string, EventRegistration> = new Map();

  register(reg: EventRegistration) {
    this.map.set(reg.name, reg);
    return reg;
  }

  remove(name: string) {
    return this.map.delete(name);
  }

  get(name: string) {
    return this.map.get(name) || null;
  }

  list() {
    return Array.from(this.map.values());
  }
}

export const defaultEventRegistry = new EventRegistry();

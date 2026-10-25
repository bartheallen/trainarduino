import defaultEventBus from './eventBus';
import { defaultEventRegistry } from './registry';
import { KnownEventNames } from './types';
import { registerAllSubscribers } from './registerAllSubscribers';

let initialized = false;
let initResult: { bus: typeof defaultEventBus; registry: typeof defaultEventRegistry } | null = null;

export function bootstrapEventBus() {
  for (const name of KnownEventNames) {
    defaultEventRegistry.register({ name, version: 1, description: `Registered event ${name}` });
  }

  return {
    bus: defaultEventBus,
    registry: defaultEventRegistry,
  };
}

export function initializeEventSystem() {
  if (initialized && initResult) return initResult;
  registerAllSubscribers();
  initResult = bootstrapEventBus();
  initialized = true;
  return initResult;
}

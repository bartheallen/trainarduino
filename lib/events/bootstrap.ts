import defaultEventBus from './eventBus';
import { defaultEventRegistry } from './registry';
import { KnownEventNames } from './types';
import { registerAllSubscribers } from './registerAllSubscribers';

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

export async function initializeEventSystem() {
  // Do not clear existing subscribers here. Tests may import subscriber modules
  // directly which registers handlers during module evaluation; clearing would
  // remove those registrations and re-importing does not re-run module top-level
  // code. Keep initialization idempotent by leaving existing subscribers intact
  // and ensuring registerAllSubscribers attempts to import any missing modules.
  await registerAllSubscribers();
  // bootstrapEventBus registers known event names and returns bus+registry
  initResult = bootstrapEventBus();
  return initResult;
}

export async function registerAllSubscribers() {
  // Dynamically import subscriber modules so they register handlers when called.
  // Using `import()` works with Vitest's ESM/TS transforms and avoids top-level
  // server-only code executing during module load. We keep initialization
  // resilient by catching and logging individual import failures.
  const subs = [
    '@/lib/events/subscribers/learningSubscriber',
    '@/lib/events/subscribers/progressSubscriber',
    '@/lib/events/subscribers/memorySubscriber',
    '@/lib/events/subscribers/recommendationSubscriber',
    '@/lib/events/subscribers/gamificationSubscriber',
    '@/lib/events/subscribers/profileSubscriber',
    '@/lib/events/subscribers/dashboardSubscriber',
    '@/lib/events/subscribers/analyticsSubscriber',
    '@/lib/events/subscribers/aiSubscriber',
    '@/lib/events/subscribers/socraticTutorSubscriber',
  ];

  for (const p of subs) {
    try {
      await import(p);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[registerAllSubscribers] failed to import', p, err && (err as Error).message);
    }
  }
}

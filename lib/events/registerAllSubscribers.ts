export async function registerAllSubscribers() {
  const importers: Array<[string, () => Promise<unknown>]> = [
    ['learningSubscriber', () => import('@/lib/events/subscribers/learningSubscriber')],
    ['progressSubscriber', () => import('@/lib/events/subscribers/progressSubscriber')],
    ['memorySubscriber', () => import('@/lib/events/subscribers/memorySubscriber')],
    ['recommendationSubscriber', () => import('@/lib/events/subscribers/recommendationSubscriber')],
    ['gamificationSubscriber', () => import('@/lib/events/subscribers/gamificationSubscriber')],
    ['profileSubscriber', () => import('@/lib/events/subscribers/profileSubscriber')],
    ['dashboardSubscriber', () => import('@/lib/events/subscribers/dashboardSubscriber')],
    ['analyticsSubscriber', () => import('@/lib/events/subscribers/analyticsSubscriber')],
    ['aiSubscriber', () => import('@/lib/events/subscribers/aiSubscriber')],
    ['socraticTutorSubscriber', () => import('@/lib/events/subscribers/socraticTutorSubscriber')],
  ];

  for (const [name, imp] of importers) {
    try {
      await imp();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[registerAllSubscribers] failed to import', name, err && (err as Error).message);
    }
  }
}

export interface LearningAnalytics {
  userId: string;
  submissions: number;
  averageScore: number;
  averageXp: number;
  feedbackRequests: number;
  lastActiveAt: string;
}

const analyticsStore: LearningAnalytics[] = [];

export function updateLearningAnalytics(userId: string, metrics: Partial<LearningAnalytics>) {
  const existing = analyticsStore.find((item) => item.userId === userId);
  if (existing) {
    Object.assign(existing, metrics, { lastActiveAt: new Date().toISOString() });
    return existing;
  }
  const newRecord: LearningAnalytics = {
    userId,
    submissions: metrics.submissions ?? 0,
    averageScore: metrics.averageScore ?? 0,
    averageXp: metrics.averageXp ?? 0,
    feedbackRequests: metrics.feedbackRequests ?? 0,
    lastActiveAt: new Date().toISOString(),
  };
  analyticsStore.push(newRecord);
  return newRecord;
}

export function getLearningAnalytics(userId: string) {
  return analyticsStore.find((item) => item.userId === userId) || null;
}

export interface LearningMemoryRecord {
  userId: string;
  interactionType: 'submission' | 'hint' | 'chat' | 'reflection';
  content: string;
  tags?: string[];
  createdAt: string;
}

const memoryStore: LearningMemoryRecord[] = [];

export function recordMemory(record: Omit<LearningMemoryRecord, 'createdAt'>) {
  const saved: LearningMemoryRecord = {
    ...record,
    createdAt: new Date().toISOString(),
  };
  memoryStore.push(saved);
  return saved;
}

export function getMemoryForUser(userId: string) {
  return memoryStore.filter((record) => record.userId === userId);
}

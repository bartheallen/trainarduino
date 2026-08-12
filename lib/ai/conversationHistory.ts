export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const conversationStore: Record<string, ConversationMessage[]> = {};

export function addConversationMessage(userId: string, message: ConversationMessage) {
  const history = conversationStore[userId] ?? [];
  const next = [...history, message];
  conversationStore[userId] = next;
  return next;
}

export function getConversationHistory(userId: string) {
  return conversationStore[userId] ?? [];
}

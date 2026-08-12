import type { ChatResponse } from '@/lib/ai/types';
import { defaultAIService } from '@/lib/ai/service';
import * as conversationRepo from '@/lib/repos/aiConversationRepo';

export async function chatWithTutor(message: string, context?: { userId?: string | null; topic?: string }): Promise<ChatResponse> {
  const userId = context?.userId;
  if (userId) {
    await conversationRepo.recordConversationMessage(userId, 'user', message, context?.topic).catch(() => null);
  }

  const response = await defaultAIService.chat(message, context);

  if (userId) {
    await conversationRepo.recordConversationMessage(userId, 'assistant', response.reply, context?.topic).catch(() => null);
  }

  return response;
}

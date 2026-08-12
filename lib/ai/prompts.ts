import type { Exercise } from '@/lib/types';
import type { EvaluationContext } from '@/lib/ai/types';

const CODE_REVIEW_PROMPT = `You are an Arduino programming instructor evaluating student code.

EXERCISE:
{exercise_title}
{exercise_prompt}
{correction_criteria}

STUDENT CODE:
{code}

EVALUATION CRITERIA:
- Does it compile?
- Does it follow Arduino conventions?
- Is it efficient?
- Are there logical errors?
- Is the solution elegant?

Provide:
1. Score (0.0-1.0)
2. Passed (true/false)
3. Brief feedback (2-3 sentences)
4. 2-3 specific suggestions
5. 1 common mistake if applicable
6. Next steps to improve

Format as JSON exactly like this:
{
  "score": 0.75,
  "passed": true,
  "feedback": "...",
  "suggestions": ["...", "..."],
  "commonMistakes": ["..."],
  "nextSteps": ["..."]
}
`;

export function buildCodeReviewPrompt(
  code: string,
  exercise: Exercise,
  context: EvaluationContext
) {
  const basePrompt = CODE_REVIEW_PROMPT
    .replace('{exercise_title}', exercise.titre)
    .replace('{exercise_prompt}', exercise.enonce)
    .replace('{correction_criteria}', exercise.critere_correction || 'Aucune consigne de correction spécifique fournie.')
    .replace('{code}', code)
    .concat(`\n\nCONTEXT:\n- language: ${context.language}\n- timeSpentSeconds: ${context.timeSpentSeconds ?? 0}\n- previousAttempts: ${context.previousAttempts ?? 0}`);

  if (context.contextSummary) {
    return `${basePrompt}\n\nLEARNING CONTEXT:\n${context.contextSummary}`;
  }

  return basePrompt;
}

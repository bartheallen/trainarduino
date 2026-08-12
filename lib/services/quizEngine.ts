export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'ordering' | 'fill-in' | 'matching';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
}

export function evaluateQuiz(questions: QuizQuestion[], answers: Record<string, unknown>): QuizResult {
  const total = questions.length;
  let correct = 0;

  questions.forEach((question) => {
    const answer = answers[question.id];
    if (Array.isArray(question.correctAnswer)) {
      const normalized = Array.isArray(answer) ? answer : [String(answer ?? '')];
      const isCorrect = normalized.length === question.correctAnswer.length && question.correctAnswer.every((item) => normalized.includes(item));
      if (isCorrect) {
        correct += 1;
      }
      return;
    }

    if (String(answer ?? '') === String(question.correctAnswer ?? '')) {
      correct += 1;
    }
  });

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  return {
    score: correct,
    total,
    percentage,
    passed: percentage >= 70,
  };
}

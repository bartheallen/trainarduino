import type { Exercise } from '@/lib/types';
import { AIProvider, EvaluationResult, EvaluationContext, HintResult, ChatResponse } from '@/lib/ai/types';

export class StubAIProvider implements AIProvider {
  name = 'stub';
  priority = 1;

  async isAvailable() {
    return true;
  }

  async estimateCost() {
    return 0;
  }

  async evaluateCode(code: string, exercise: Exercise, context: EvaluationContext): Promise<EvaluationResult> {
    const baseScore = Math.max(
      0,
      Math.min(
        1,
        0.6 + (exercise.xp_recompense ? exercise.xp_recompense / 200 : 0) - code.length / 2000 - ((context.previousAttempts ?? 0) * 0.02)
      )
    );
    const passed = baseScore >= 0.7;
    const contextNote = context.contextSummary ? ' Le retour prend en compte l’historique d’apprentissage.' : '';
    const feedback = `Analyse de code simulée pour ${exercise.titre}.${contextNote} ${passed ? 'Le code semble satisfaisant' : 'Le code requiert des ajustements'}.`;
    const suggestions = passed
      ? ['Vérifiez la temporisation du signal.', 'Gardez les commentaires concis.']
      : ['Vérifiez que setup() et loop() sont présents.', 'Assurez-vous que pinMode est configuré avant digitalWrite.'];

    return {
      score: Number(baseScore.toFixed(2)),
      passed,
      feedback,
      suggestions,
      commonMistakes: passed ? ['Aucune erreur évidente'] : ['PinMode manquant avant digitalWrite'],
      nextSteps: passed
        ? ['Affinez les commentaires et testez sur du matériel réel.']
        : ['Ajoutez l’initialisation Arduino manquante et relancez.'],
      providerName: this.name,
      estimatedCostCents: 0,
      modelName: 'stub-model',
    };
  }

  async generateHint(exercise: Exercise, previousHints: string[] | null): Promise<HintResult> {
    const baseHint = `Commencez par vérifier le bloc d'initialisation de la carte pour ${exercise.titre}.`;
    const extra = previousHints && previousHints.length > 0 ? ' Vous pouvez approfondir votre approche à partir du dernier conseil donné.' : '';
    return {
      hint: `${baseHint}${extra}`,
      reason: 'Encourage l’initialisation correcte avant d’ajouter de la logique.',
    };
  }

  async chat(message: string): Promise<ChatResponse> {
    return {
      reply: `Je suis prêt à vous aider. Vous avez demandé : ${message}`,
    };
  }
}

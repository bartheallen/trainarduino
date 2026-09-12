import { callMistralJson, getMistralApiKey } from '@/lib/ai/gemini';

export type PracticalAiCriteria = {
  pin_used?: boolean;
  pin_mode_configured?: boolean;
  digital_output_used?: boolean;
  delay_used?: boolean;
};

export type PracticalAiAnalysis = {
  criteria: PracticalAiCriteria;
};

function extractJson(text: string): string | null {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  return firstBrace >= 0 && lastBrace > firstBrace ? text.slice(firstBrace, lastBrace + 1) : null;
}

function parseAnalysis(text: string): PracticalAiAnalysis | null {
  const json = extractJson(text);
  if (!json) return null;

  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const criteria = (parsed as { criteria?: unknown }).criteria;
    if (!criteria || typeof criteria !== 'object') return null;

    const source = criteria as Record<string, unknown>;
    const result: PracticalAiCriteria = {};
    for (const key of ['pin_used', 'pin_mode_configured', 'digital_output_used', 'delay_used'] as const) {
      if (typeof source[key] === 'boolean') result[key] = source[key];
    }
    return { criteria: result };
  } catch {
    return null;
  }
}

export async function analyzePracticalCodeWithAi(
  code: string,
  exercise: { titre?: string | null; enonce?: string | null; critere_correction?: string | null },
): Promise<PracticalAiAnalysis | null> {
  const apiKey = getMistralApiKey();
  const debug = process.env.DEBUG_PRACTICAL_AI === 'true';
  if (!apiKey) {
    if (debug) console.debug('[practical-ai] missing GEMINI_API_KEY');
    return null;
  }

  const prompt = `Analyse ce code Arduino uniquement pour les critères pratiques demandés. Réponds uniquement avec un JSON valide de la forme {"criteria":{"pin_used":boolean,"pin_mode_configured":boolean,"digital_output_used":boolean,"delay_used":boolean}}. Comprends les constantes et macros, par exemple const int led = 13 ou #define LED_PIN 13. Ne fournis aucun score, verdict, progression ou décision de validation.
Titre: ${exercise.titre ?? ''}
Énoncé: ${exercise.enonce ?? ''}
Critères: ${exercise.critere_correction ?? ''}
Code:
${code}`;

  try {
    const { text } = await callMistralJson(prompt);
    if (debug) console.debug('[practical-ai] Gemini response received', { length: text.length });
    const analysis = parseAnalysis(text);
    if (debug) console.debug('[practical-ai] parsed response', { analysis });
    return analysis;
  } catch (error) {
    if (debug) console.debug('[practical-ai] request or parsing failure', { error: error instanceof Error ? error.message : 'unknown error' });
    return null;
  }
}

export type PracticalAiCriteria = {
  pin_used?: boolean;
  pin_mode_configured?: boolean;
  digital_output_used?: boolean;
  delay_used?: boolean;
};

export type PracticalAiAnalysis = {
  criteria: PracticalAiCriteria;
};

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

function createGroqPayload(prompt: string) {
  return {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };
}

function extractTextFromGroqResponse(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const message = choices[0] && typeof choices[0] === 'object'
    ? (choices[0] as { message?: unknown }).message
    : null;
  if (!message || typeof message !== 'object') return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === 'string' ? content : null;
}

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
  const apiKey = process.env.GROQ_API_KEY;
  const debug = process.env.DEBUG_PRACTICAL_AI === 'true';
  if (!apiKey) {
    if (debug) console.debug('[practical-ai] missing GROQ_API_KEY');
    return null;
  }

  const prompt = `Analyse ce code Arduino uniquement pour les critères pratiques demandés. Réponds uniquement avec un JSON valide de la forme {"criteria":{"pin_used":boolean,"pin_mode_configured":boolean,"digital_output_used":boolean,"delay_used":boolean}}. Comprends les constantes et macros, par exemple const int led = 13 ou #define LED_PIN 13. Ne fournis aucun score, verdict, progression ou décision de validation.
Titre: ${exercise.titre ?? ''}
Énoncé: ${exercise.enonce ?? ''}
Critères: ${exercise.critere_correction ?? ''}
Code:
${code}`;

  try {
    const payload = createGroqPayload(prompt);
    if (debug) console.debug('[practical-ai] Groq request', { model: GROQ_MODEL, endpoint: GROQ_ENDPOINT, keyPresent: true });

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 500);
      if (debug) console.debug('[practical-ai] Groq HTTP error', { status: response.status, error: errorText });
      return null;
    }
    if (debug) console.debug('[practical-ai] Groq HTTP success', { status: response.status });
    const body: unknown = await response.json();
    const text = extractTextFromGroqResponse(body);
    const analysis = text ? parseAnalysis(text) : null;

    if (debug) {
      console.debug('[practical-ai] parsed response', { hasText: Boolean(text), analysis });
    }
    return analysis;
  } catch (error) {
    if (debug) console.debug('[practical-ai] request or parsing failure', { error: error instanceof Error ? error.message : 'unknown error' });
    return null;
  }
}
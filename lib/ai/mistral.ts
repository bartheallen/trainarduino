const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export function getMistralApiKey() {
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  return apiKey || null;
}

export const MISTRAL_MODEL = process.env.MISTRAL_MODEL?.trim() || 'mistral-small-latest';

type MistralCompletion = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

export async function callMistralJson(
  prompt: string,
  model: string = MISTRAL_MODEL,
): Promise<{ text: string; model: string }> {
  const apiKey = getMistralApiKey();
  if (!apiKey) {
    throw new Error('Missing MISTRAL_API_KEY');
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('[mistral] API error', { status: response.status, details });
    throw new Error(`Mistral API request failed with status ${response.status}`);
  }

  const data = (await response.json()) as MistralCompletion;
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Mistral returned an empty response');
  }

  return { text, model };
}

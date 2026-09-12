const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export function getMistralApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey || null;
}

export const MISTRAL_MODEL = 'gemini-2.5-flash';

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: unknown }>;
    };
  }>;
};

export async function callMistralJson(
  prompt: string,
  model: string = MISTRAL_MODEL,
): Promise<{ text: string; model: string }> {
  const apiKey = getMistralApiKey();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const endpoint = `${GEMINI_API_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('[gemini] API error', { status: response.status, details });
    throw new Error(`Gemini API request failed with status ${response.status}`);
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const text = data.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Gemini returned an empty response');
  }

  return { text, model };
}

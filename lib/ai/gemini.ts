const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export function getMistralApiKey() {
  const apiKey = (
    process.env.GEMINI_API_KEY
    ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ?? process.env.GOOGLE_API_KEY
    ?? process.env.GROQ_API_KEY
    ?? process.env.MISTRAL_API_KEY
  )?.trim();
  return apiKey || null;
}

export const MISTRAL_MODEL = process.env.MISTRAL_MODEL?.trim() || 'mistral-small-latest';
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || 'qwen/qwen3.8-27b';

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: unknown }>;
    };
  }>;
};

type MistralChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

async function callGroqJson(prompt: string): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('[groq] API error', { status: response.status, details });
    throw new Error(`Groq API request failed with status ${response.status}`);
  }

  const data = (await response.json()) as MistralChatCompletionResponse;
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Groq returned an empty response');
  }

  return { text, model: GROQ_MODEL };
}

export async function callMistralJson(
  prompt: string,
  model: string = MISTRAL_MODEL,
): Promise<{ text: string; model: string }> {
  const apiKey = getMistralApiKey();
  if (!apiKey) {
    throw new Error('Missing AI API key');
  }

  const isGemini = Boolean(
    process.env.GEMINI_API_KEY
    ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ?? process.env.GOOGLE_API_KEY,
  );
  const isGroq = !isGemini && Boolean(process.env.GROQ_API_KEY?.trim());

  if (isGroq) {
    return callGroqJson(prompt);
  }

  if (!isGemini) {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
      if (response.status === 429 && process.env.GROQ_API_KEY?.trim()) {
        console.warn('[mistral] rate limit reached, falling back to Groq');
        return callGroqJson(prompt);
      }
      throw new Error(`Mistral API request failed with status ${response.status}`);
    }

    const data = (await response.json()) as MistralChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Mistral returned an empty response');
    }

    return { text, model };
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

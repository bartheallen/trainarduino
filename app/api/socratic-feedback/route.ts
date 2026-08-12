import { NextResponse } from 'next/server';

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

function extractTextFromGroqResponse(responseBody: unknown): string | null {
  if (!responseBody || typeof responseBody !== 'object') return null;
  const choices = (responseBody as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const message = choices[0] && typeof choices[0] === 'object'
    ? (choices[0] as { message?: unknown }).message
    : null;
  if (!message || typeof message !== 'object') return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === 'string' ? content : null;
}

function extractJsonString(text: string): string | null {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'La configuration de l’IA est manquante. Impossible de vérifier la réponse pour le moment.' },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error('[socratic-feedback] JSON parse failed:', error);
    return NextResponse.json(
      { error: 'Le corps de la requête est invalide. Attendu JSON.' },
      { status: 400 },
    );
  }

  const { question, hint, explanation, answer } = body as {
    question?: unknown;
    hint?: unknown;
    explanation?: unknown;
    answer?: unknown;
  };

  // Log the incoming client payload (only non-sensitive fields)
  try {
    console.log('[socratic-feedback] incoming payload:', {
      question: typeof question === 'string' ? question : '[missing|invalid]',
      hint: typeof hint === 'string' ? hint : '[missing|invalid]',
      explanation: typeof explanation === 'string' ? explanation : '[missing|invalid]',
      answer: typeof answer === 'string' ? answer : '[missing|invalid]',
    });
  } catch (e) {
    console.error('[socratic-feedback] failed to log incoming payload', e);
  }

  if (typeof question !== 'string' || typeof answer !== 'string') {
    return NextResponse.json(
      { error: 'Les champs question et answer sont requis et doivent être des chaînes de caractères.' },
      { status: 400 },
    );
  }

  const prompt = `Tu es un assistant pédagogique. Évalue si la réponse de l'élève montre une compréhension correcte de la question guidée.` +
    ` Sois indulgent sur la formulation, mais strict sur le fond. Ne réponds qu'avec du JSON valide strict, sans explication additionnelle ni texte libre.` +
    `
Question:
${question}

Indice:
${hint ?? 'Aucun indice fourni.'}

Explication:
${explanation ?? 'Aucune explication fournie.'}

Réponse de l'élève:
${answer}

Réponds uniquement avec ce format JSON exact : {"correct": boolean, "feedback": "message court et encourageant en français"}`;

  const payload = createGroqPayload(prompt);

  console.log('[socratic-feedback] Groq request:', { model: GROQ_MODEL, endpoint: GROQ_ENDPOINT, keyPresent: true, keyLength: process.env.GROQ_API_KEY.length });

  let groqResponse: Response;
  try {
    groqResponse = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[socratic-feedback] Groq fetch failed - error message:', message);
    console.error('[socratic-feedback] Groq fetch failed - stack:', stack ?? '[no stack]');
    return NextResponse.json(
      { error: 'Impossible de contacter le service d’IA. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  if (!groqResponse.ok) {
    const errText = await groqResponse.text();
    console.error('[socratic-feedback] Groq response status:', groqResponse.status);
    console.error('[socratic-feedback] Groq response raw body:', errText);
    return NextResponse.json(
      { error: 'Le service d’IA a renvoyé une erreur. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  let responseBody: any;
  let responseText: string | null = null;
  try {
    // Always capture the raw response text for debugging before parsing
    responseText = await groqResponse.text();
    console.log('[socratic-feedback] Groq success raw response:', responseText);
    try {
      responseBody = JSON.parse(responseText);
    } catch (parseErr) {
      const parseMessage = parseErr instanceof Error ? parseErr.message : String(parseErr);
      const parseStack = parseErr instanceof Error ? parseErr.stack : undefined;
      console.error('[socratic-feedback] Failed to JSON.parse Groq response - error:', parseMessage);
      console.error('[socratic-feedback] Parse stack:', parseStack ?? '[no stack]');
      console.error('[socratic-feedback] Raw Groq response for inspection:', responseText);
      throw parseErr;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[socratic-feedback] Groq parse failed, raw response:', responseText, 'error message:', message);
    console.error('[socratic-feedback] Groq parse failed - stack:', stack ?? '[no stack]');
    return NextResponse.json(
      { error: 'Réponse du service d’IA invalide. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  let text: string | null;
  try {
    text = extractTextFromGroqResponse(responseBody);
    console.log('[socratic-feedback] extractTextFromGroqResponse result:', text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[socratic-feedback] extractTextFromGroqResponse threw:', message);
    throw error;
  }
  if (!text) {
    return NextResponse.json(
      { error: 'Impossible de lire la réponse de l’IA. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  const jsonString = extractJsonString(text);
  console.log('[socratic-feedback] text passed to extractJsonString:', text);
  console.log('[socratic-feedback] jsonString extracted before JSON.parse:', jsonString);
  if (!jsonString) {
    return NextResponse.json(
      { error: 'L’IA n’a pas renvoyé de JSON valide. Réessayez.' },
      { status: 502 },
    );
  }

  let parsed: { correct?: unknown; feedback?: unknown };
  try {
    parsed = JSON.parse(jsonString) as { correct?: unknown; feedback?: unknown };
  } catch {
    return NextResponse.json(
      { error: 'Impossible d’analyser la réponse de l’IA. Réessayez.' },
      { status: 502 },
    );
  }

  const correct = parsed.correct === true;
  const feedback = typeof parsed.feedback === 'string' ? parsed.feedback : '';

  if (feedback.length === 0) {
    return NextResponse.json(
      { error: 'L’IA n’a pas fourni de retour clair. Réessayez.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ correct, feedback });
}

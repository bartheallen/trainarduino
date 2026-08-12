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
      { error: 'La configuration de l’IA est manquante. Impossible de corriger le code pour le moment.' },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Le corps de la requête est invalide. Attendu JSON.' },
      { status: 400 },
    );
  }

  const { code, exerciseTitre, exerciseEnonce } = body as {
    code?: unknown;
    exerciseTitre?: unknown;
    exerciseEnonce?: unknown;
  };

  if (typeof code !== 'string' || typeof exerciseTitre !== 'string' || typeof exerciseEnonce !== 'string') {
    return NextResponse.json(
      { error: 'Les champs code, exerciseTitre et exerciseEnonce sont requis et doivent être des chaînes de caractères.' },
      { status: 400 },
    );
  }

  const prompt = `Tu es un assistant de correction de code Arduino/C++. Analyse le code fourni par rapport à l'énoncé de l'exercice et identifie les problèmes de logique, de syntaxe, de comportement ou d'adéquation avec l'objectif attendu.` +
    ` Ne réponds qu'avec du JSON valide strict, sans texte libre.` +
    `
Titre de l'exercice:
${exerciseTitre}

Énoncé de l'exercice:
${exerciseEnonce}

Code de l'élève:
${code}

Réponds uniquement dans ce format JSON exact : {"correct": boolean, "issues": ["problème 1", "problème 2", ...], "feedback": "résumé encourageant en 1-2 phrases"}`;

  const payload = createGroqPayload(prompt);
  console.log('[code-review] Groq request:', { model: GROQ_MODEL, endpoint: GROQ_ENDPOINT, keyPresent: true, keyLength: process.env.GROQ_API_KEY.length });

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
    return NextResponse.json(
      { error: 'Impossible de contacter le service d’IA. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  if (!groqResponse.ok) {
    const errText = await groqResponse.text();
    console.error('[code-review] Groq response status:', groqResponse.status);
    console.error('[code-review] Groq response raw body:', errText);
    return NextResponse.json(
      { error: 'Le service d’IA a renvoyé une erreur. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  let responseBody: any;
  let responseText: string | null = null;
  try {
    responseText = await groqResponse.text();
    console.log('[code-review] Groq success raw response:', responseText);
    responseBody = JSON.parse(responseText);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[code-review] Failed to parse Gemini response:', message);
    console.error('[code-review] Raw response for inspection:', responseText);
    return NextResponse.json(
      { error: 'Réponse du service d’IA invalide. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  let text: string | null;
  try {
    text = extractTextFromGroqResponse(responseBody);
    console.log('[code-review] extractTextFromGroqResponse result:', text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[code-review] extractTextFromGroqResponse threw:', message);
    throw error;
  }
  if (!text) {
    return NextResponse.json(
      { error: 'Impossible de lire la réponse de l’IA. Réessayez plus tard.' },
      { status: 502 },
    );
  }

  const jsonString = extractJsonString(text);
  console.log('[code-review] text passed to extractJsonString:', text);
  console.log('[code-review] jsonString extracted before JSON.parse:', jsonString);
  if (!jsonString) {
    return NextResponse.json(
      { error: 'L’IA n’a pas renvoyé de JSON valide. Réessayez.' },
      { status: 502 },
    );
  }

  let parsed: { correct?: unknown; issues?: unknown; feedback?: unknown };
  try {
    parsed = JSON.parse(jsonString) as { correct?: unknown; issues?: unknown; feedback?: unknown };
  } catch {
    return NextResponse.json(
      { error: 'Impossible d’analyser la réponse de l’IA. Réessayez.' },
      { status: 502 },
    );
  }

  const correct = parsed.correct === true;
  const issues = Array.isArray(parsed.issues) ? parsed.issues.filter((issue) => typeof issue === 'string') : [];
  const feedback = typeof parsed.feedback === 'string' ? parsed.feedback : '';

  if (process.env.DEBUG_PRACTICAL_VALIDATION === 'true') {
    console.debug('[practical-validation][ai-result]', {
      correct,
      issues,
      feedback,
      rawKeys: Object.keys(parsed),
    });
  }

  if (feedback.length === 0) {
    return NextResponse.json(
      { error: 'L’IA n’a pas fourni de retour clair. Réessayez.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ correct, issues, feedback });
}

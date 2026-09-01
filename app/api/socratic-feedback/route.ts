import { NextResponse } from 'next/server';
import { callMistralJson } from '@/lib/ai/mistral';

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
  if (!process.env.MISTRAL_API_KEY) {
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

  try {
    console.log('[socratic-feedback] incoming payload:', {
      question: typeof question === 'string' ? question : '[missing|invalid]',
      hint: typeof hint === 'string' ? hint : '[missing|invalid]',
      explanation: typeof explanation === 'string' ? explanation : '[missing|invalid]',
      answer: typeof answer === 'string' ? answer : '[missing|invalid]',
    });
  } catch (error) {
    console.error('[socratic-feedback] failed to log incoming payload', error);
  }

  if (typeof question !== 'string' || typeof answer !== 'string') {
    return NextResponse.json(
      { error: 'Les champs question et answer sont requis et doivent être des chaînes de caractères.' },
      { status: 400 },
    );
  }

  const prompt = `Tu es un assistant pédagogique. Évalue si la réponse de l'élève montre une compréhension correcte de la question guidée.
Sois indulgent sur la formulation, mais strict sur le fond.
Réponds uniquement avec du JSON valide strict, sans explication additionnelle.

Question:
${question}

Indice:
${hint ?? 'Aucun indice fourni.'}

Explication:
${explanation ?? 'Aucune explication fournie.'}

Réponse de l'élève:
${answer}

Format exact attendu : {"correct": boolean, "feedback": "message court et encourageant en français"}`;

  try {
    const { text } = await callMistralJson(prompt);

    const jsonString = extractJsonString(text);
    if (!jsonString) {
      return NextResponse.json(
        { error: 'L’IA n’a pas renvoyé de JSON valide. Réessayez.' },
        { status: 502 },
      );
    }

    let parsed: { correct?: unknown; feedback?: unknown };
    try {
      parsed = JSON.parse(jsonString) as { correct?: unknown; feedback?: unknown };
    } catch (error) {
      console.error('[socratic-feedback] JSON parse failed:', error);
      return NextResponse.json(
        { error: 'Impossible d’analyser la réponse de l’IA. Réessayez.' },
        { status: 502 },
      );
    }

    const correct = parsed.correct === true;
    const feedback = typeof parsed.feedback === 'string' ? parsed.feedback : '';

    if (!feedback) {
      return NextResponse.json(
        { error: 'L’IA n’a pas fourni de retour clair. Réessayez.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ correct, feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[socratic-feedback] Mistral request failed:', message);
    return NextResponse.json(
      { error: 'Le service d’IA a renvoyé une erreur. Réessayez plus tard.' },
      { status: 502 },
    );
  }
}

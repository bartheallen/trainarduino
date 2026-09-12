import { NextResponse } from 'next/server';
import { callMistralJson, getMistralApiKey } from '@/lib/ai/gemini';

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
  if (!getMistralApiKey()) {
    console.error('[code-review] GEMINI_API_KEY absente ou vide dans le runtime');
    return NextResponse.json(
      { error: 'La configuration de l’IA est manquante. Impossible de corriger le code pour le moment.' },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error('[code-review] JSON parse failed:', error);
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

  const prompt = `Tu es un assistant de correction de code Arduino/C++. Analyse le code fourni par rapport à l'énoncé de l'exercice et identifie les problèmes de logique, de syntaxe, de comportement ou d'adéquation avec l'objectif attendu.
Réponds uniquement avec du JSON valide strict, sans texte libre.

Titre de l'exercice:
${exerciseTitre}

Énoncé de l'exercice:
${exerciseEnonce}

Code de l'élève:
${code}

Format exact attendu : {"correct": boolean, "issues": ["problème 1", "problème 2"], "feedback": "résumé encourageant en 1-2 phrases"}`;

  try {
    const { text } = await callMistralJson(prompt);

    const jsonString = extractJsonString(text);
    if (!jsonString) {
      return NextResponse.json(
        { error: 'L’IA n’a pas renvoyé de JSON valide. Réessayez.' },
        { status: 502 },
      );
    }

    let parsed: { correct?: unknown; issues?: unknown; feedback?: unknown };
    try {
      parsed = JSON.parse(jsonString) as { correct?: unknown; issues?: unknown; feedback?: unknown };
    } catch (error) {
      console.error('[code-review] JSON parse failed:', error);
      return NextResponse.json(
        { error: 'Impossible d’analyser la réponse de l’IA. Réessayez.' },
        { status: 502 },
      );
    }

    const correct = parsed.correct === true;
    const issues = Array.isArray(parsed.issues) ? parsed.issues.filter((issue): issue is string => typeof issue === 'string') : [];
    const feedback = typeof parsed.feedback === 'string' ? parsed.feedback : '';

    if (!feedback) {
      return NextResponse.json(
        { error: 'L’IA n’a pas fourni de retour clair. Réessayez.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ correct, issues, feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[code-review] Gemini request failed:', message);
    return NextResponse.json(
      { error: 'Le service d’IA a renvoyé une erreur. Réessayez plus tard.' },
      { status: 502 },
    );
  }
}

import { NextResponse } from 'next/server';
import { validatePracticalTestAction } from '@/lib/exerciseServerActions';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ValidatePracticalBody {
  exerciseId?: unknown;
  code?: unknown;
  codeReview?: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ValidatePracticalBody;
    if (!Number.isInteger(payload.exerciseId) || typeof payload.code !== 'string') {
      return NextResponse.json({ error: 'exerciseId and code are required.' }, { status: 400 });
    }
    const exerciseId = payload.exerciseId as number;
    const code = payload.code;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const result = await validatePracticalTestAction(exerciseId, code, user.id, payload.codeReview as any);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/validate-practical] error', error);
    const message = error instanceof Error ? error.message : 'Server error';
    const status = message.includes('non authentifié') ? 401 : message.includes('introuvable') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { markSocraticCompletionAction } from '@/lib/services/learningProgressService';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { moduleId?: unknown };
    if (!Number.isInteger(payload.moduleId)) {
      return NextResponse.json({ error: 'moduleId is required.' }, { status: 400 });
    }
    const moduleId = payload.moduleId as number;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const result = await markSocraticCompletionAction(user.id, moduleId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/learning-progress/socratic] error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 },
    );
  }
}
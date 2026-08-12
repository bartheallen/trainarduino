import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = Boolean(email && password && supabaseUrl && supabaseAnonKey);

const describeE2E = configured ? describe : describe.skip;

interface E2EExercise {
  id: number;
  module_id: number;
}

interface E2ESubmission {
  id: number;
  statut: string;
  xp_gagne: number;
  note: number | null;
}

interface E2EProgress {
  module_id: number;
  statut: string;
  score: number;
  exercices_completes: number;
}

describeE2E('authenticated module 11 E2E', () => {
  let supabase: ReturnType<typeof createClient>;
  let userId = '';
  let cookieHeader = '';
  let exerciseId = 0;
  let moduleId = 11;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email!,
      password: password!,
    });
    if (error || !data.session || !data.user) {
      throw new Error(`E2E login failed: ${error?.message ?? 'missing session'}`);
    }

    userId = data.user.id;
    const cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
    const sessionClient = createServerClient(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll: () => [],
        setAll: (values) => {
          cookies.push(...values);
        },
      },
    });
    await sessionClient.auth.setSession(data.session);
    cookieHeader = cookies.map(({ name, value }) => `${name}=${value}`).join('; ');

    const { data: exercises, error: exerciseError } = await supabase
      .from('exercises')
      .select('id,module_id')
      .eq('module_id', moduleId)
      .order('ordre', { ascending: true })
      .limit(1);
    if (exerciseError || !exercises?.[0]) {
      throw new Error(`E2E exercise lookup failed: ${exerciseError?.message ?? 'no exercise'}`);
    }
    exerciseId = (exercises as E2EExercise[])[0].id;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  async function request(path: string, init?: RequestInit) {
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Cookie: cookieHeader },
    });
  }

  async function submission(code: string) {
    return request('/api/validate-practical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId, code }),
    });
  }

  it('loads module 11, validates approved and rejected submissions, and is idempotent', async () => {
    const moduleResponse = await request('/modules/11');
    const moduleHtml = await moduleResponse.text();
    expect(moduleResponse.status).toBe(200);
    expect(moduleHtml).toContain('Engineering Lab');
    expect(moduleHtml).toContain('Éditeur de code');

    const invalidResponse = await submission('');
    const invalidResult = await invalidResponse.json();
    expect(invalidResponse.status).toBe(200);
    expect(invalidResult.statut).toBe('rejected');
    expect(invalidResult.xpAwarded).toBe(0);

    const validCode = `void setup() { pinMode(13, OUTPUT); }\nvoid loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }`;
    const firstResponse = await submission(validCode);
    const firstResult = await firstResponse.json();
    expect(firstResponse.status).toBe(200);
    expect(firstResult.statut).toBe('approved');
    expect(firstResult.score).toBeGreaterThanOrEqual(60);

    const repeatedResponse = await submission(validCode);
    const repeatedResult = await repeatedResponse.json();
    expect(repeatedResponse.status).toBe(200);
    expect(repeatedResult.statut).toBe('approved');

    const { data: submissions, error: persistenceError } = await supabase
      .from('submissions')
      .select('id,statut,xp_gagne,note')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId);
    expect(persistenceError).toBeNull();
    expect(submissions).toHaveLength(1);
    expect((submissions as E2ESubmission[] | null)?.[0].statut).toBe('approved');

    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select('module_id,statut,score,exercices_completes')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .maybeSingle();
    expect(progressError).toBeNull();
    expect((progress as E2EProgress | null)?.module_id).toBe(moduleId);
    expect((progress as E2EProgress | null)?.exercices_completes).toBeGreaterThanOrEqual(1);
  });

  it('rejects unauthenticated validation without persistence', async () => {
    const response = await fetch(`${baseUrl}/api/validate-practical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId, code: '' }),
    });
    expect(response.status).toBe(401);
  });
});
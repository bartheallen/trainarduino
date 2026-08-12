import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env.local manually
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
    if (m) {
      const key = m[1];
      let value = m[2];
      // remove optional surrounding quotes
      if ((value.startsWith("\'") && value.endsWith("\'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  try {
    const testEmail = `debug+${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log('Attempting signUp with', testEmail);
    const signUpParams = {
      email: testEmail,
      // password omitted from logs
      options: null,
      redirectTo: undefined,
      emailRedirectTo: undefined,
      data: null,
    };
    console.log('signUp params', signUpParams);

    const { data, error } = await supabase.auth.signUp({ email: testEmail, password });
    console.log('signUp result:', { data, error: error ? { message: error.message, code: error?.code } : null });

    console.log('Attempting signInWithPassword');
    const r = await supabase.auth.signInWithPassword({ email: testEmail, password });
    console.log('signIn result:', r);
    // If sign-in returned a session, set it on the client and query profiles
    const userId = r?.data?.user?.id;
    const session = r?.data?.session;
    if (session) {
      await supabase.auth.setSession(session);
    }

    if (userId) {
      console.log('Querying profiles for user id', userId);
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
      console.log('profiles select result:', { profileData, profileError: profileError ? { message: profileError.message, code: profileError?.code } : null });

      // Also fetch without single() to inspect raw rows
      const { data: rawRows, error: rawError } = await supabase.from('profiles').select('*').eq('id', userId);
      console.log('profiles raw rows:', { rawRows, rawError: rawError ? { message: rawError.message, code: rawError?.code } : null });
    }
  } catch (err) {
    console.error('Unexpected error in script:', err);
  }
}

run();

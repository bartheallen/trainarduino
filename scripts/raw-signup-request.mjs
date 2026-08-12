import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
    if (m) {
      const key = m[1];
      let value = m[2];
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const testEmail = `debug+raw+${Date.now()}@example.com`;
const password = 'Password123!';

(async () => {
  try {
    const endpoint = `${url.replace(/\/$/, '')}/auth/v1/signup`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ email: testEmail, password }),
    });

    const headers = {};
    res.headers.forEach((v, k) => (headers[k] = v));
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // not json
    }

    console.log('status:', res.status);
    console.log('headers:', headers);
    console.log('bodyRaw:', text);
    if (json !== null) console.log('bodyJson:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('request failed', err);
  }
})();

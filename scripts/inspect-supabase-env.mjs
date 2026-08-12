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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
const anonPresent = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let project = undefined;
if (url && typeof url === 'string') {
  const m = url.match(/^https:\/\/([^.]+)\./);
  if (m) project = m[1];
}

console.log(JSON.stringify({ url, project, anonPresent }, null, 2));

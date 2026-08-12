const fs = require('fs');
const path = require('path');
const root = process.cwd();
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) files.push(p);
  }
}
walk(root);
const types = fs.readFileSync(path.join(root, 'lib', 'events', 'types.ts'), 'utf8');
const knownMatch = types.match(/export const KnownEventNames = \[([\s\S]*?)\] as const;/);
const names = knownMatch ? Array.from(knownMatch[1].matchAll(/['\"]([A-Za-z0-9_]+)['\"]/g), m => m[1]) : [];
const counts = names.reduce((acc, name) => ({ ...acc, [name]: { publish: 0, subscribe: 0 } }), {});
for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  for (const name of names) {
    const pubMatches = txt.match(new RegExp(`name\\s*:\\s*['\\"]${name}['\\"]`, 'g')) || [];
    const subMatches = txt.match(new RegExp(`subscribe\\(\\s*['\\"]${name}['\\"]`, 'g')) || [];
    counts[name].publish += pubMatches.length;
    counts[name].subscribe += subMatches.length;
  }
}
console.log(JSON.stringify(counts, null, 2));

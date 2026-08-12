const fs = require('fs');
const path = require('path');
const root = path.resolve('.');
const tsFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(p);
    } else if (/\.(ts|tsx)$/.test(name)) {
      tsFiles.push(p);
    }
  }
}
walk(root);
const knownSource = fs.readFileSync(path.join(root, 'lib', 'events', 'types.ts'), 'utf8');
const knownMatch = knownSource.match(/KnownEventNames = \[([\s\S]*?)\]/m);
const knownNames = new Set();
if (knownMatch) {
  for (const m of knownMatch[1].matchAll(/['\"]([^'\"]+)['\"]/g)) {
    knownNames.add(m[1]);
  }
}
const used = new Set();
const pushUsed = (name) => { if (name) used.add(name); };
for (const file of tsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  const makeEventRegex = /makeEvent\(\{[\s\S]*?name:\s*['\"]([^'\"]+)['\"][\s\S]*?\}\)/g;
  while ((match = makeEventRegex.exec(text))) pushUsed(match[1]);
  const emitEventRegex = /emitEvent\([^\)]*['\"]([^'\"]+)['\"]/g;
  while ((match = emitEventRegex.exec(text))) pushUsed(match[1]);
  const subscribeRegex = /subscribe\(['\"]([^'\"]+)['\"]\)/g;
  while ((match = subscribeRegex.exec(text))) pushUsed(match[1]);
}
const knownOnly = [...knownNames].filter((name) => !used.has(name)).sort();
const usedOnly = [...used].filter((name) => !knownNames.has(name)).sort();
console.log(JSON.stringify({ knownCount: knownNames.size, usedCount: used.size, knownOnly, usedOnly, known: [...knownNames].sort(), used: [...used].sort() }, null, 2));

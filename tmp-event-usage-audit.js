const fs = require('fs');
const path = require('path');
const root = process.cwd();
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
const typesPath = path.join(root, 'lib', 'events', 'types.ts');
const typesSource = fs.readFileSync(typesPath, 'utf8');
const knownMatch = typesSource.match(/KnownEventNames = \[([\s\S]*?)\]/m);
if (!knownMatch) {
  console.error('Could not parse KnownEventNames');
  process.exit(1);
}
const names = [...knownMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const report = {};
for (const name of names) {
  report[name] = { publish: 0, subscribe: 0, totalReferences: 0 };
}
for (const file of tsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const name of names) {
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    const count = (text.match(regex) || []).length;
    if (count === 0) continue;
    report[name].totalReferences += count;
    if (text.includes(`subscribe('${name}'`) || text.includes(`subscribe(\"${name}\"`) || text.includes(`subscribe(
\\`${name}\\`) || text.includes(`subscribe(
\\`${name}\\`)) {
      report[name].subscribe += 1;
    }
    if (text.includes(`makeEvent({ name: '${name}'`) || text.includes(`makeEvent({ name: \"${name}\"`) || text.includes(`emitEvent(`) && (text.includes(`'${name}'`) || text.includes(`"${name}"`)) || text.includes(`publish(`) && text.includes(name)) {
      report[name].publish += 1;
    }
  }
}
console.log(JSON.stringify(report, null, 2));

const fs = require('fs');
const path = require('path');
const root = process.cwd();
const allFiles = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git') continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) walk(p);
    else if (item.isFile() && (p.endsWith('.ts') || p.endsWith('.tsx'))) allFiles.push(p);
  }
}
walk(root);
const namePattern = /name\s*:\s*['\"]([A-Za-z0-9_]+)['\"]/g;
const subscribePattern = /subscribe\(\s*['\"]([A-Za-z0-9_]+)['\"]/g;
const anyPattern = /['\"]([A-Za-z0-9_]+)['\"]/g;
const publishCounts = {};
const subscribeCounts = {};
const anyCounts = {};
for (const file of allFiles) {
  const txt = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = namePattern.exec(txt))) {
    publishCounts[match[1]] = (publishCounts[match[1]] || 0) + 1;
  }
  while ((match = subscribePattern.exec(txt))) {
    subscribeCounts[match[1]] = (subscribeCounts[match[1]] || 0) + 1;
  }
  while ((match = anyPattern.exec(txt))) {
    anyCounts[match[1]] = (anyCounts[match[1]] || 0) + 1;
  }
}
const knownEventsPath = path.join(root,'lib','events','types.ts');
const types = fs.readFileSync(knownEventsPath,'utf8');
const knownMatch = types.match(/export const KnownEventNames = \[([\s\S]*?)\] as const;/);
const known = knownMatch ? Array.from(knownMatch[1].matchAll(/['\"]([A-Za-z0-9_]+)['\"]/g), m => m[1]) : [];
const report = {
  knownEvents: known.map(name => ({
    name,
    published: publishCounts[name] || 0,
    subscribed: subscribeCounts[name] || 0,
    any: anyCounts[name] || 0,
  })),
  extraEvents: Object.keys(publishCounts).concat(Object.keys(subscribeCounts)).filter((x,i,arr)=>arr.indexOf(x)===i && !known.includes(x)).sort(),
  filesScanned: allFiles.length,
};
report.knownEvents.sort((a,b)=>a.name.localeCompare(b.name));
console.log(JSON.stringify(report,null,2));

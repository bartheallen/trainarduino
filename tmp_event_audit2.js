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
const knownEventsPath = path.join(root, 'lib', 'events', 'types.ts');
const types = fs.readFileSync(knownEventsPath,'utf8');
const knownMatch = types.match(/export const KnownEventNames = \[([\s\S]*?)\] as const;/);
const names = knownMatch ? Array.from(knownMatch[1].matchAll(/['\"]([A-Za-z0-9_]+)['\"]/g), m => m[1]) : [];
const counts = names.reduce((acc,name)=>{acc[name]={strings:0}; return acc;},{ });
for(const file of allFiles){ const txt = fs.readFileSync(file,'utf8'); for(const name of names){ const regex = new RegExp(`['\"]${name}['\"]`,'g'); const matches = txt.match(regex); if(matches) counts[name].strings += matches.length; }}
console.log(JSON.stringify({names,counts},null,2));

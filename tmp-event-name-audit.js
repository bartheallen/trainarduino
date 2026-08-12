const fs = require('fs');
const path = require('path');
const root = process.cwd();
const tsFiles = [];
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p = path.join(dir,name);
    const stat = fs.statSync(p);
    if(stat.isDirectory()){
      if(name==='node_modules' || name==='.git') continue;
      walk(p);
    } else if(/\.(ts|tsx)$/.test(name)) tsFiles.push(p);
  }
}
walk(root);
const allNames = new Set();
for(const file of tsFiles){
  const text = fs.readFileSync(file,'utf8');
  const regex = /makeEvent\(\{[\s\S]*?name:\s*['\"]([^'\"]+)['\"][\s\S]*?\}/g;
  let m;
  while((m = regex.exec(text))){ allNames.add(m[1]); }
  const emitRegex = /emitEvent\([^\)]*['\"]([^'\"]+)['\"]/g;
  while ((m = emitRegex.exec(text))) { allNames.add(m[1]); }
  const subscribeRegex = /subscribe\(['\"]([^'\"]+)['\"]\)/g;
  while ((m = subscribeRegex.exec(text))) { allNames.add(m[1]); }1]); }
}
const knownSource = fs.readFileSync(path.join(root,'lib','events','types.ts'),'utf8');
const knownMatch = knownSource.match(/KnownEventNames = \[([\s\S]*?)\]/m);
const knownNames = new Set();
if(knownMatch){
  [...knownMatch[1].matchAll(/['\"]([^'\"]+)['\"]/g)].forEach(m=>knownNames.add(m[1]));
}
console.log('used:', Array.from(allNames).sort());
console.log('known:', Array.from(knownNames).sort());
console.log('missing in known:', Array.from(allNames).filter(x=>!knownNames.has(x)).sort());
console.log('unused in known:', Array.from(knownNames).filter(x=>!allNames.has(x)).sort());

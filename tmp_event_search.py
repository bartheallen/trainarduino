from pathlib import Path
import re
root = Path('.').resolve()
files = [p for p in root.rglob('*.ts') if 'node_modules' not in p.parts and '.git' not in p.parts]
files += [p for p in root.rglob('*.tsx') if 'node_modules' not in p.parts and '.git' not in p.parts]
known_text = (root / 'lib' / 'events' / 'types.ts').read_text(encoding='utf8')
known_match = re.search(r'KnownEventNames = \[([\s\S]*?)\]', known_text)
known_names = []
if known_match:
    known_names = [m.group(1) for m in re.finditer(r"['\"]([^'\"]+)['\"]", known_match.group(1))]
used = {name: 0 for name in known_names}
additional = {}
for file in files:
    text = file.read_text(encoding='utf8')
    for name in known_names:
        pattern = re.compile(re.escape(name))
        count = len(pattern.findall(text))
        if count:
            used[name] += count
    for match in re.finditer(r"['\"]([^'\"]+)['\"]", text):
        event = match.group(1)
        if event not in used:
            additional[event] = additional.get(event, 0) + 1
print('known count', len(known_names))
print('used counts')
for name in sorted(known_names):
    if used[name] > 0:
        print(f'{name}: {used[name]}')
print('\nunused known names')
for name in sorted(known_names):
    if used[name] == 0:
        print(name)
print('\nadditional string literals found as candidate event names from known patterns:')
for name, count in sorted(additional.items(), key=lambda x: (-x[1], x[0]))[:50]:
    print(f'{name}: {count}')

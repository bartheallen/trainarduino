from pathlib import Path
import re
root = Path('.').resolve()
files = list(root.rglob('*.ts')) + list(root.rglob('*.tsx'))
known_text = (root / 'lib' / 'events' / 'types.ts').read_text(encoding='utf8')
known_match = re.search(r'KnownEventNames = \[([\s\S]*?)\]', known_text)
known_names = []
if known_match:
    known_names = [m.group(1) for m in re.finditer(r"['\"]([^'\"]+)['\"]", known_match.group(1))]
used = set()
for file in files:
    text = file.read_text(encoding='utf8')
    for m in re.finditer(r"makeEvent\(\{[\s\S]*?name:\s*['\"]([^'\"]+)['\"][\s\S]*?\}\)", text):
        used.add(m.group(1))
    for m in re.finditer(r"emitEvent\([^\)]*['\"]([^'\"]+)['\"]", text):
        used.add(m.group(1))
    for m in re.finditer(r"subscribe\(['\"]([^'\"]+)['\"]\)", text):
        used.add(m.group(1))
    for m in re.finditer(r"defaultPublisher\.publish\(\s*makeEvent\(\{[\s\S]*?name:\s*['\"]([^'\"]+)['\"][\s\S]*?\}\)", text):
        used.add(m.group(1))
print('known_count', len(known_names))
print('used_count', len(used))
print('known_only', sorted([name for name in known_names if name not in used]))
print('used_only', sorted([name for name in used if name not in known_names]))
print('known_names', sorted(known_names))
print('used_names', sorted(used))

import os, re, json
root = os.getcwd()
files = []
for dirpath, dirnames, filenames in os.walk(root):
    if 'node_modules' in dirpath or '.next' in dirpath:
        continue
    for fn in filenames:
        if fn.endswith(('.ts', '.tsx')):
            files.append(os.path.join(dirpath, fn))
service_dir = os.path.join(root, 'lib', 'services')
repo_dir = os.path.join(root, 'lib', 'repos')
ai_dir = os.path.join(root, 'lib', 'ai')
services = [os.path.relpath(os.path.join(service_dir, fn), root) for fn in os.listdir(service_dir) if fn.endswith('.ts')]
repos = [os.path.relpath(os.path.join(repo_dir, fn), root) for fn in os.listdir(repo_dir) if fn.endswith('.ts')]
ai_files = [os.path.relpath(os.path.join(ai_dir, fn), root) for fn in os.listdir(ai_dir) if fn.endswith('.ts')]
content = {}
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content[path] = f.read()
service_usage = {}
for svc in services:
    key = os.path.splitext(os.path.basename(svc))[0]
    pattern = re.compile(r"['\"]@/lib/services/%s['\"]" % re.escape(key))
    service_usage[svc] = sum(1 for txt in content.values() if pattern.search(txt))
repo_usage = {}
for repo in repos:
    key = os.path.splitext(os.path.basename(repo))[0]
    pattern = re.compile(r"['\"]@/lib/repos/%s['\"]" % re.escape(key))
    repo_usage[repo] = sum(1 for txt in content.values() if pattern.search(txt))
event_names = []
types_path = os.path.join(root, 'lib', 'events', 'types.ts')
with open(types_path, 'r', encoding='utf-8') as f:
    txt = f.read()
    m = re.search(r'export const KnownEventNames = \[([^\]]+)\]', txt, re.S)
    if m:
        event_names = re.findall(r"['\"]([A-Za-z0-9_]+)['\"]", m.group(1))
publish = {name: 0 for name in event_names}
subscribe = {name: 0 for name in event_names}
for txt in content.values():
    for name in event_names:
        publish[name] += len(re.findall(rf"name\s*:\s*['\"]{re.escape(name)}['\"]", txt))
        subscribe[name] += len(re.findall(rf"subscribe\(['\"]{re.escape(name)}['\"]", txt))
server_actions = [os.path.relpath(p, root) for p in files if os.path.relpath(p, root).endswith('ServerActions.ts') or os.path.relpath(p, root).endswith('serverActions.ts')]
ai_provider_files = [os.path.join(root, 'lib', 'ai', 'providers.ts'), os.path.join(root, 'lib', 'ai', 'providers', 'correctionProvider.ts'), os.path.join(root, 'lib', 'ai', 'service.ts')]
ai_info = {}
for path in ai_provider_files:
    with open(path, 'r', encoding='utf-8') as f:
        ai_info[os.path.relpath(path, root)] = f.read().count('registerProvider')
print(json.dumps({'service_usage': service_usage, 'repo_usage': repo_usage, 'publish': publish, 'subscribe': subscribe, 'server_actions': server_actions, 'ai_info': ai_info}, indent=2))

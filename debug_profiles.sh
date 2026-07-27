#!/bin/sh
T=$(curl -s https://nexerp.id/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"aurel@nexerp.id","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

B=$(curl -s https://nexerp.id/api/marketing/prototype/bundle -H "Authorization: Bearer $T")
echo "$B" | python3 -c "
import sys,json
d = json.load(sys.stdin)

print('=== TASK PICS ===')
pics = set()
for t in d.get('tasks',[]):
    pics.add(t.get('pic'))
print(f'Unique PICs: {pics}')

print()
print('=== PROFILE NAMES ===')
for p in d.get('profiles',[]):
    print(f'  - {p.get(\"name\")}')

print()
print('=== PERFORMANCE NAMES ===')
for m in d.get('performance',[]):
    print(f'  - {m.get(\"name\")}')
"

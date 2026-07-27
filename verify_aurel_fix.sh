#!/bin/sh
T=$(curl -s https://nexerp.id/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"aurel@nexerp.id","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

B=$(curl -s https://nexerp.id/api/marketing/prototype/bundle -H "Authorization: Bearer $T")
echo "$B" | python3 -c "
import sys,json
d = json.load(sys.stdin)
v = d.get('viewer',{})
print(f'Viewer: {v.get(\"name\")}')
print(f'isManager: {v.get(\"isManager\")}')
tasks = d.get('tasks',[])
print(f'Tasks: {len(tasks)}')
profiles = d.get('profiles',[])
print(f'Profiles visible: {len(profiles)}')
for p in profiles:
    print(f'  - {p.get(\"name\")} ({p.get(\"role\")})')
"

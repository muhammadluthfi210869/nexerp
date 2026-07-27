#!/bin/sh
echo "=== AUREL - API TEST (fresh login) ==="
T1=$(curl -s https://nexerp.id/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"aurel@nexerp.id","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

echo "User info dari login:"
curl -s https://nexerp.id/api/auth/profile -H "Authorization: Bearer $T1" \
  | python3 -c "import sys,json; u=json.load(sys.stdin); print(f'  Email: {u.get(\"email\")}'); print(f'  Roles: {u.get(\"roles\")}')"

echo ""
echo "=== BUNDLE ==="
B1=$(curl -s https://nexerp.id/api/marketing/prototype/bundle \
  -H "Authorization: Bearer $T1")
echo "$B1" | python3 -c "
import sys,json
d = json.load(sys.stdin)
v = d.get('viewer',{})
print(f'Viewer name: {v.get(\"name\")}')
print(f'isManager: {v.get(\"isManager\")}')
tasks = d.get('tasks',[])
print(f'Tasks returned: {len(tasks)}')
for t in tasks:
    print(f'  - {t.get(\"title\")} (pic: {t.get(\"pic\")})')
projects = d.get('projects',[])
print(f'Projects returned: {len(projects)}')
profiles = d.get('profiles',[])
print(f'Profiles returned: {len(profiles)}')
for p in profiles:
    print(f'  - {p.get(\"name\")} ({p.get(\"role\")})')
"

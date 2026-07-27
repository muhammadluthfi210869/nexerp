#!/bin/sh
echo "=== BUILD TIMESTAMP ==="
docker exec production-light-frontend-1 stat -c "%y" /app/.next/server/app-paths-manifest.json

echo ""
echo "=== CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep production-light

echo ""
echo "=== TEST AUREL ==="
T=$(curl -s https://nexerp.id/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"aurel@nexerp.id","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

B=$(curl -s https://nexerp.id/api/marketing/prototype/bundle -H "Authorization: Bearer $T")
echo "$B" | python3 -c "
import sys,json
d = json.load(sys.stdin)
v = d.get('viewer',{})
print('isManager: ' + str(v.get('isManager')))
print('Tasks: ' + str(len(d.get('tasks',[]))))
print('Profiles: ' + str(len(d.get('profiles',[]))))
for p in d.get('profiles',[]):
    print('  - ' + p.get('name'))
"
echo ""
echo "=== DONE ==="

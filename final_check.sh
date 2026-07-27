#!/bin/sh
echo "=== CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep production-light

echo ""
echo "=== GUSTI (non-manager) ==="
T1=$(curl -s https://nexerp.id/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"gusti@nexerp.id","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token','FAIL'))")

B1=$(curl -s https://nexerp.id/api/marketing/prototype/bundle \
  -H "Authorization: Bearer $T1")
echo "$B1" | python3 -c "
import sys,json
d = json.load(sys.stdin)
v = d.get('viewer',{})
print(f'  Name: {v.get(\"name\")}')
print(f'  isManager: {v.get(\"isManager\")}')
print(f'  Tasks: {len(d.get(\"tasks\",[]))}')
"

echo ""
echo "=== REVITA (manager) ==="
T2=$(curl -s https://nexerp.id/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"revita@nexerp.id","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token','FAIL'))")

B2=$(curl -s https://nexerp.id/api/marketing/prototype/bundle \
  -H "Authorization: Bearer $T2")
echo "$B2" | python3 -c "
import sys,json
d = json.load(sys.stdin)
v = d.get('viewer',{})
print(f'  Name: {v.get(\"name\")}')
print(f'  isManager: {v.get(\"isManager\")}')
print(f'  Tasks: {len(d.get(\"tasks\",[]))}')
"
echo ""
echo "=== ? DONE ==="

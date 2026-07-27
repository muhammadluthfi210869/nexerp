#!/bin/sh
echo "Status: $(docker inspect production-light-frontend-1 --format '{{.State.Health.Status}}')"

echo ""
echo "=== Checking placeholderData ==="
COUNT=$(docker exec production-light-frontend-1 sh -c 'find /app/.next -name "*.js" -exec grep -l "placeholderData" {} \; 2>/dev/null | wc -l')
echo "Files with placeholderData: $COUNT"
if [ "$COUNT" -eq 0 ]; then echo "=> placeholderData REMOVED"; fi

echo ""
echo "=== Checking fallbackManager ==="
COUNT=$(docker exec production-light-frontend-1 sh -c 'find /app/.next -name "*.js" -exec grep -l "fallbackManager" {} \; 2>/dev/null | wc -l')
echo "Files with fallbackManager: $COUNT"
if [ "$COUNT" -eq 0 ]; then echo "=> fallbackManager REMOVED"; fi

echo ""
echo "=== Testing Aurel API ==="
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
echo "Done"

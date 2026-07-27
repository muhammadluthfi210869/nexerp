#!/bin/sh
T=$(curl -s https://nexerp.id/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"revita@nexerp.id","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

B=$(curl -s https://nexerp.id/api/marketing/prototype/bundle -H "Authorization: Bearer $T")
echo "$B" | python3 -c "
import sys,json
d = json.load(sys.stdin)
v = d.get('viewer',{})
print(f'Revita: isManager={v.get(\"isManager\")}')
print(f'Tasks: {len(d.get(\"tasks\",[]))}')
print(f'Profiles: {len(d.get(\"profiles\",[]))}')
for p in d.get('profiles',[]):
    print(f'  - {p.get(\"name\")}')
"

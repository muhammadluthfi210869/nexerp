#!/bin/bash
# Update admin@nexerp.id password in staging DB
# Reads hash from backend/admin-hash.txt and updates via SQL file

set -e

HASH=$(cat "$(dirname "$0")/backend/admin-hash.txt")
echo "Using hash: $HASH"

# Write SQL with literal hash
cat > /tmp/update-admin.sql <<EOF
UPDATE users SET "passwordHash" = '${HASH}' WHERE email = 'admin@nexerp.id' RETURNING email, "fullName", roles;
EOF

echo "SQL to execute:"
cat /tmp/update-admin.sql

# Copy to Biznet and run via docker exec
scp /tmp/update-admin.sql dreamlab@103.93.134.215:/tmp/update-admin.sql
ssh dreamlab@103.93.134.215 'cat /tmp/update-admin.sql | docker exec -i production-light-db-1 psql -U erp_user -d erp_database_staging'

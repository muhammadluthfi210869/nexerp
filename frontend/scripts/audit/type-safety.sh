#!/bin/bash
# type-safety.sh — A1.6: Run tsc --noEmit di frontend + backend
# Usage: ./type-safety.sh
# Exit 0 = no errors, Exit 1 = errors found

set -e
ERRORS=0

echo "=== Frontend type-check ==="
cd frontend
if npx tsc --noEmit 2>&1 | tee /tmp/tsc-frontend.log; then
  echo "✅ Frontend: 0 errors"
else
  echo "🚫 Frontend: type errors found"
  ERRORS=1
fi
cd ..

echo ""
echo "=== Backend type-check ==="
cd backend
if npx tsc --noEmit 2>&1 | tee /tmp/tsc-backend.log; then
  echo "✅ Backend: 0 errors"
else
  echo "🚫 Backend: type errors found"
  ERRORS=1
fi
cd ..

exit $ERRORS

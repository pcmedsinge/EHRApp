#!/bin/bash

echo "========================================"
echo "  EHR Login Test"
echo "========================================"
echo ""

echo "Testing Backend (Direct)..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ Backend login: SUCCESS"
else
  echo "❌ Backend login: FAILED"
  echo "Response: $RESPONSE"
fi

echo ""
echo "Testing Frontend Proxy..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ Frontend proxy: SUCCESS"
else
  echo "❌ Frontend proxy: FAILED"
  echo "Response: $RESPONSE"
fi

echo ""
echo "========================================"
echo "If both show SUCCESS, the issue is in your browser."
echo ""
echo "Try these steps:"
echo "1. Open browser in Incognito/Private mode"
echo "2. Go to: http://localhost:3000"
echo "3. Open DevTools (F12) and check Console tab for errors"
echo "4. Try login with: admin / admin123"
echo ""
echo "If you see errors in Console, copy them and let me know."
echo "========================================"

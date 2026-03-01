#!/usr/bin/env bash
# Run with: ./scripts/test-auth.sh
# Requires: server running (npm run dev) and serviceAccountKey.json in backend/

BASE="${BASE_URL:-http://localhost:3000/api/v1}"

echo "1. Register"
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}')
echo "$REG" | head -c 200
echo ""

USER_ID=$(echo "$REG" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).user_id)}catch(e){}})")
TOKEN=$(echo "$REG" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token)}catch(e){}})")

if [ -z "$TOKEN" ]; then
  echo "Register failed or already exists. Trying login..."
  LOGIN=$(curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}')
  echo "$LOGIN"
  TOKEN=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token)}catch(e){}})")
fi

if [ -n "$TOKEN" ]; then
  echo ""
  echo "2. GET /auth/me"
  curl -s -H "Authorization: Bearer $TOKEN" "$BASE/auth/me"
  echo ""
fi

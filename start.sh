#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "서버 종료 중..."
  kill $BACKEND_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "백엔드 시작 중... (http://localhost:5000)"
cd "$ROOT/backend" && node server.js &
BACKEND_PID=$!

sleep 1

echo "프론트엔드 시작 중... (http://localhost:3000)"
cd "$ROOT/frontend" && npm run dev

cleanup

#!/usr/bin/env bash
# kyroo.sh — Start the full Kyroo stack (DB + backend + frontend + mobile)
# Usage: ./kyroo.sh [start|db|backend|frontend|mobile|android|ios|install|seed]

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$ROOT/mobile"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

command_exists() { command -v "$1" >/dev/null 2>&1; }

free_port() {
  local pid
  pid=$(lsof -ti tcp:"$1" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Freeing port $1 (PID $pid)..."
    kill -9 $pid 2>/dev/null || true
  fi
}

check_deps() {
  command_exists node || { echo "Error: Node.js not found. Install from https://nodejs.org"; exit 1; }
  command_exists npm  || { echo "Error: npm not found."; exit 1; }
}

ensure_backend_deps() {
  [ -d "$BACKEND_DIR/node_modules" ] || (echo "Installing backend deps…"; cd "$BACKEND_DIR" && npm install)
}
ensure_frontend_deps() {
  [ -d "$FRONTEND_DIR/node_modules" ] || (echo "Installing frontend deps…"; cd "$FRONTEND_DIR" && npm install)
}
ensure_mobile_deps() {
  [ -d "$MOBILE_DIR/node_modules" ] || (echo "Installing mobile deps…"; cd "$MOBILE_DIR" && npm install && node scripts/generate-favicon.js)
}

CMD="${1:-start}"
check_deps

case "$CMD" in

  install)
    echo "Installing all dependencies…"
    (cd "$BACKEND_DIR"  && npm install)
    (cd "$FRONTEND_DIR" && npm install)
    (cd "$MOBILE_DIR"   && npm install && node scripts/generate-favicon.js)
    echo "Done."
    ;;

  seed)
    ensure_backend_deps
    echo "Seeding database…"
    cd "$ROOT" && node db/seed.js
    ;;

  migrate)
    ensure_backend_deps
    echo "Running database migration…"
    cd "$ROOT" && node db/migrate.js
    ;;

  users)
    ensure_backend_deps
    echo "Creating test users…"
    cd "$ROOT" && node db/create-test-users.js
    ;;

  db)
    echo "Starting PostgreSQL container…"
    cd "$ROOT"
    DB_PORT=15434 docker compose up -d --wait
    echo "Database ready on port 15434."
    ;;

  backend)
    ensure_backend_deps
    free_port 3002
    echo "Starting Kyroo backend on http://localhost:3002 …"
    cd "$BACKEND_DIR" && npm run dev
    ;;

  frontend)
    ensure_frontend_deps
    echo "Starting Kyroo frontend on http://localhost:5173 …"
    cd "$FRONTEND_DIR" && npm run dev
    ;;

  start)
    echo "Starting Kyroo (DB + backend + mobile)…"

    # Start DB
    cd "$ROOT"
    DB_PORT=15434 docker compose up -d --wait
    echo "[DB] PostgreSQL ready."

    # Start backend in background
    ensure_backend_deps
    free_port 3002
    cd "$BACKEND_DIR" && npm run dev &
    BACKEND_PID=$!
    echo "[Backend] PID $BACKEND_PID"

    # Start mobile (Expo web) in background
    ensure_mobile_deps
    cd "$MOBILE_DIR" && npx expo start --web &
    MOBILE_PID=$!
    echo "[Mobile] PID $MOBILE_PID"

    echo ""
    echo " Kyroo is starting:"
    echo "   Backend  ->  http://localhost:3002"
    echo "   Mobile   ->  http://localhost:8081  (opens in browser automatically)"
    echo ""
    echo " First run? In a new terminal run: ./kyroo.sh seed"
    echo " Press Ctrl+C to stop all services."

    trap "kill $BACKEND_PID $MOBILE_PID 2>/dev/null; exit" INT TERM
    wait
    ;;

  mobile)
    ensure_mobile_deps
    echo "Starting Kyroo mobile in browser…"
    cd "$MOBILE_DIR" && npx expo start --web
    ;;

  android)
    ensure_mobile_deps
    echo "Starting Kyroo on Android…"
    cd "$MOBILE_DIR" && npx expo start --android
    ;;

  ios)
    ensure_mobile_deps
    [[ "$(uname)" != "Darwin" ]] && echo "Warning: iOS simulator requires macOS. Use Expo Go on device."
    echo "Starting Kyroo on iOS…"
    cd "$MOBILE_DIR" && npx expo start --ios
    ;;

  *)
    echo "Kyroo — Usage: $0 [start|db|backend|frontend|mobile|android|ios|install|seed]"
    echo ""
    echo "  start      Start DB + backend + mobile (default)"
    echo "  db         Start PostgreSQL container"
    echo "  backend    Start Express API (port 3002)"
    echo "  mobile     Start Expo mobile in browser (port 8081)"
    echo "  frontend   Start Vite web app (port 5173)"
    echo "  android    Start Expo on Android"
    echo "  ios        Start Expo on iOS"
    echo "  install    Install all dependencies"
    echo "  seed       Seed the database"
    exit 1
    ;;
esac

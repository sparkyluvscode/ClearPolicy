#!/usr/bin/env bash
set -euo pipefail

# Move to repo root (this script is in scripts/)
cd "$(dirname "$0")/.."

echo "==> Checking Node.js/npm..."
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "==> Node.js not found. Installing via nvm..."
  if ! command -v curl >/dev/null 2>&1; then
    echo "ERROR: curl is required to install nvm. Please install curl (or install Node via Homebrew) and re-run." >&2
    exit 1
  fi
  export NVM_DIR="$HOME/.nvm"
  if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
  nvm install --lts
  nvm use --lts
fi

echo "==> Node version: $(node -v)"
echo "==> Npm version: $(npm -v)"

if [ ! -f .env ]; then
  echo "==> Creating .env with placeholders"
  cat > .env << 'EOF'
CONGRESS_API_KEY=your_api_data_gov_key
OPENSTATES_API_KEY=your_openstates_key
GOOGLE_CIVIC_API_KEY=your_google_civic_key
NEXT_PUBLIC_APP_NAME=ClearPolicy
DATABASE_URL="file:./dev.db"
EOF
fi

echo "==> Installing dependencies"
npm i

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Running Prisma migrate"
npx prisma migrate dev --name init --create-only >/dev/null 2>&1 || true
npx prisma migrate dev --name init

echo "==> Seeding database"
npx prisma db seed

echo "==> Starting dev server (Ctrl+C to stop)"
npm run dev



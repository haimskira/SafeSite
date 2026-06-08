#!/bin/bash
set -e

REPO_URL="https://github.com/haimskira/SafeSite.git"
BRANCH="main"
APP_DIR="/opt/safesite"
DOCKER_DIR="$APP_DIR/docker"

# ────────────────────────────────────────────
# 1. Git – clone or pull
# ────────────────────────────────────────────
if [ ! -d "$APP_DIR/.git" ]; then
  echo "[*] Cloning repository..."
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  echo "[*] Resetting and pulling latest changes..."
  git -C "$APP_DIR" fetch --all
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
  git -C "$APP_DIR" clean -fd
  git -C "$APP_DIR" pull origin "$BRANCH"
fi

# ────────────────────────────────────────────
# 2. Permissions
# ────────────────────────────────────────────
echo "[*] Setting permissions..."
chmod -R 755 "$APP_DIR"
chmod +x "$APP_DIR/deploy.sh"

# ────────────────────────────────────────────
# 3. Docker – build and run
# ────────────────────────────────────────────
echo "[*] Building and starting Docker containers..."
cd "$DOCKER_DIR"
docker compose down --remove-orphans
docker compose up --build -d

echo ""
echo "[✓] Deployment complete."
echo "    Frontend : http://localhost:31857"
echo "    Backend  : http://localhost:47293"

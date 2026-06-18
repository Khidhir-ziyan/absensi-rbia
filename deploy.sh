#!/bin/bash

# Deploy script untuk Absensi RBIA
# Usage: ./deploy.sh [backend|frontend|all|git]

set -e

case "$1" in
  backend)
    echo "🚀 Deploying backend..."
    cd backend
    npm run deploy
    echo "✅ Backend deployed!"
    ;;

  frontend)
    echo "🚀 Deploying frontend..."
    cd frontend
    npm run build
    npx wrangler pages deploy dist --project-name=absensi-rbia --commit-dirty
    echo "✅ Frontend deployed!"
    ;;

  all)
    echo "🚀 Deploying all..."
    cd backend
    npm run deploy
    cd ../frontend
    npm run build
    npx wrangler pages deploy dist --project-name=absensi-rbia --commit-dirty
    echo "✅ All deployed!"
    ;;

  git)
    echo "📤 Pushing to GitHub..."
    git add .
    read -p "Commit message: " msg
    git commit -m "$msg"
    git push
    echo "✅ Pushed to GitHub!"
    ;;

  *)
    echo "Usage: ./deploy.sh [backend|frontend|all|git]"
    echo ""
    echo "Commands:"
    echo "  backend    - Deploy backend ke Cloudflare Workers"
    echo "  frontend   - Build & deploy frontend ke Cloudflare Pages"
    echo "  all        - Deploy backend + frontend"
    echo "  git        - Push ke GitHub"
    ;;
esac

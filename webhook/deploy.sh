#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

LOG=/home/ubuntu/webhook/deploy.log
cd /home/ubuntu/kontfeel-calculator

log() { echo "$(date) - $1" >> "$LOG"; }

log "Déploiement lancé..."

git checkout -- package-lock.json
git pull origin main >> "$LOG" 2>&1

npm install >> "$LOG" 2>&1
npx prisma migrate deploy >> "$LOG" 2>&1
npx prisma generate >> "$LOG" 2>&1
npm run build >> "$LOG" 2>&1

# Recharger uniquement l'app, pas le webhook (évite de se tuer soi-même)
pm2 reload kontfeel-calculator >> "$LOG" 2>&1

log "Déploiement terminé !"

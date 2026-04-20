#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd /home/ubuntu/kontfeel-calculator

echo "$(date) - Déploiement lancé..." >> /home/ubuntu/webhook/deploy.log

git pull origin main
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 reload all

echo "$(date) - Déploiement terminé !" >> /home/ubuntu/webhook/deploy.log

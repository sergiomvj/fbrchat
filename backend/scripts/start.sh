#!/bin/bash
# Script de inicialização do FBRChat

echo "--- [BOOT] Starting FBRChat Operational Node ---"

# Verifica se o DATABASE_URL está presente
if [ -z "$DATABASE_URL" ]; then
    echo "[ERROR] DATABASE_URL is not set in environment!"
    # Tenta construir a partir das variáveis individuais se existirem
    if [ ! -z "$DB_HOST" ]; then
        echo "[INFO] Reconstructing DATABASE_URL from components..."
        export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    else
        echo "[FATAL] No database configuration found. Crashing."
        exit 1
    fi
fi

echo "[INFO] DATABASE_URL detected. Syncing schema..."

# Gera o client do Prisma (necessário para o import no código)
npx prisma generate

# Sincroniza o banco de dados
echo "[INFO] Pushing schema to database..."
npx prisma db push --accept-data-loss

# Roda o seed se necessário (pode falhar se já houver dados, por isso o || true)
echo "[INFO] Running database seed..."
npx prisma db seed || echo "[WARN] Seed skipped or already applied."

echo "[SUCCESS] Database ready. Launching application..."

# Inicia o servidor Node diretamente
exec node src/server.js

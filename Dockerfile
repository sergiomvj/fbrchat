# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Copia arquivos de dependência do frontend
COPY frontend/package*.json ./
# Instala todas as dependências (necessário para o build)
RUN npm install
# Copia o código fonte do frontend
COPY frontend/ ./
# Gera o build de produção (pasta dist)
RUN npm run build

# Stage 2: Final Image (Backend + Frontend Assets)
FROM node:20-alpine
WORKDIR /app

# Instala dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl

# Otimizações de produção
ENV NODE_ENV=production

# Copia os arquivos de dependência do backend e a pasta do Prisma
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instala dependências de produção do backend
RUN npm ci --only=production

# Copia o código fonte do backend
COPY backend/ .

# Copia o build do frontend gerado no Stage 1 para a pasta que o backend espera
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Porta padrão do FBR Chat (Backend serve o Frontend aqui)
EXPOSE 3000

# Garantir permissão de execução no script de start
RUN chmod +x scripts/start.sh

CMD ["./scripts/start.sh"]

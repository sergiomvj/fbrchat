FROM node:20-alpine

WORKDIR /app

# Instala dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl

# Otimizações de produção
ENV NODE_ENV=production

# Copia os arquivos de dependência do backend e a pasta do Prisma
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instala apenas dependências de produção
RUN npm ci --only=production

# Copia o código fonte do backend
COPY backend/ .

# Porta padrão do FBR Chat backend
EXPOSE 3000

# Garantir permissão de execução no script de start
RUN chmod +x scripts/start.sh

CMD ["./scripts/start.sh"]

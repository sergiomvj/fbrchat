FROM node:20-alpine

WORKDIR /app

# Otimizações de produção
ENV NODE_ENV=production

# Copia os arquivos de dependência do backend
COPY backend/package*.json ./

# Instala apenas dependências de produção
RUN npm ci --only=production

# Copia o código fonte do backend
COPY backend/ .

# Porta padrão do FBR Chat backend
EXPOSE 3000

CMD ["npm", "start"]

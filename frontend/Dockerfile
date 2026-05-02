# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Injetar a URL da API durante o build (necessário para o Vite)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./

# Install all dependencies (development + production) needed to build
RUN npm ci

COPY . .

# Build the Vite/React application
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

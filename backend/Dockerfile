FROM node:20-alpine

WORKDIR /app

# Ensure standard Node.js optimizations for Production
ENV NODE_ENV=production

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

COPY . .

# FBR Chat backend uses port 3000
EXPOSE 3000

CMD ["npm", "start"]

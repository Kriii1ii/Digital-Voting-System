# Backend Dockerfile
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

ENV PORT=5001
EXPOSE 5001

CMD ["node", "server.js"]

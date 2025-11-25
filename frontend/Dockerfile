# Frontend multi-stage Dockerfile: build with Node, serve with nginx
FROM node:18-alpine AS build
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runtime
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

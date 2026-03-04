# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Vite reads .env.production at build time. Create before deploy:
#   echo "VITE_API_BASE_URL=https://YOUR-BACKEND-URL/api/v1" > .env.production
# Do NOT set ENV VITE_API_BASE_URL here — it would override .env.production when empty.
ARG VITE_USE_MOCK_API=false
ARG VITE_ALLOW_MOCK_FALLBACK=false
ENV VITE_USE_MOCK_API=${VITE_USE_MOCK_API}
ENV VITE_ALLOW_MOCK_FALLBACK=${VITE_ALLOW_MOCK_FALLBACK}

RUN npm run build

# Serve stage
FROM node:20-slim
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]

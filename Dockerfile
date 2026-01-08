# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY tsconfig.json ./

# Copy packages and apps
COPY packages/common ./packages/common
COPY apps/main-agent ./apps/main-agent

# Install dependencies and build all workspaces
RUN npm install
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/apps/main-agent/dist ./apps/main-agent/dist
COPY --from=builder /app/apps/main-agent/package.json ./apps/main-agent/package.json
# Use template as default config in the image
COPY --from=builder /app/apps/main-agent/config.toml.template ./apps/main-agent/config.toml

EXPOSE 3000

# Set working directory to the app
WORKDIR /app/apps/main-agent

CMD ["node", "dist/index.js"]

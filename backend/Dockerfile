# Stage 1: Build the TypeScript code
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# പ്രൊഡക്ഷന് ആവശ്യമുള്ള മോഡ്യൂളുകൾ മാത്രം ഇൻസ്റ്റാൾ ചെയ്യുന്നു (devDependencies ഒഴിവാക്കുന്നു)
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/server.js"]

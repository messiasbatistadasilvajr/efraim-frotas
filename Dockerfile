# Stage 1: Build packages and compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copia arquivos de manifesto
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDependencies)
RUN npm ci

# Copia código fonte
COPY . .

# Gera o Prisma Client nativo para o Alpine e compila o código NestJS
RUN npx prisma generate
RUN npm run build

# Remove dependências de desenvolvimento para economizar espaço
RUN npm prune --production

# Stage 2: Runtime Container enxuto pronto para produção
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copia artefatos indispensáveis do builder stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Porta padrão de ingress
EXPOSE 3000

# Executa migrações do Prisma e inicia a API em modo standalone
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]

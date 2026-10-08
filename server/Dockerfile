FROM node:20-alpine

WORKDIR /app

# Instalar dependências necessárias de produção
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copiar código da API
COPY src ./src

# Expor porta da API
EXPOSE 3000

USER node

CMD ["node", "src/index.js"]

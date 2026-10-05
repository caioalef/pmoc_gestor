FROM node:20-alpine

WORKDIR /app

# Instalar dependências necessárias
COPY package.json ./
RUN npm install --production

# Copiar código da API
COPY src ./src

# Expor porta da API
EXPOSE 3000

CMD ["node", "src/index.js"]

FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema para Docker
RUN apk add --no-cache \
    docker-cli \
    git \
    bash \
    curl

# Copiar archivos de dependencias primero (para aprovechar caché de Docker)
COPY package*.json ./

# Instalar dependencias de Node.js (todas, no solo production para desarrollo)
RUN npm install

# Copiar código fuente
COPY . .

# Copiar y hacer ejecutable el script de entrada
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Exponer puerto
EXPOSE 3000

# Usar script de entrada
ENTRYPOINT ["./docker-entrypoint.sh"]

# Comando para iniciar
CMD ["node", "src/app.js"]


FROM node:20-alpine

WORKDIR /app
RUN apk update && apk upgrade --no-cache
COPY package*.json tsconfig.json ./
RUN npm install

# Copiamos todo el código fuente y las carpetas de recursos (incluida /public)
COPY . .

EXPOSE 3001

# Variables de entorno por defecto
ENV PRINTER_IP=192.168.1.100
ENV PRINTER_PORT=9100

CMD ["npm", "start"]
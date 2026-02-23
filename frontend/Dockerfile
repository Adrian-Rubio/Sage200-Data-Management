# Builder stage (Compila React usando Node)
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Build the project
COPY . .
RUN npm run build

# Production stage (Sirve la web con un Nginx mini)
FROM nginx:alpine

# Copiamos los archivos compilados del frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default config with our custom proxy setup
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 del VPS (Nginx) a nuestro entorno
EXPOSE 80

# Inicia nginx y no se apaga
CMD ["nginx", "-g", "daemon off;"]

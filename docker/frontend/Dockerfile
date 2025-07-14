# =================================
# OBREIRO DIGITAL - FRONTEND DOCKERFILE
# =================================

FROM node:18-alpine AS base

# Configurar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# =================================
# DEVELOPMENT STAGE
# =================================
FROM base AS development

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta do Vite
EXPOSE 5173

# Comando para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# =================================
# BUILD STAGE
# =================================
FROM base AS build

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# =================================
# PRODUCTION STAGE
# =================================
FROM nginx:alpine AS production

# Copiar configuração do nginx
COPY docker/nginx/prod.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação
COPY --from=build /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
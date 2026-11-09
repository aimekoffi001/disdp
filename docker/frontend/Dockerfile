# Étape 1 : Construction de l'application Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copie des fichiers de dépendances
COPY frontend/package*.json ./
RUN npm ci

# Copie de l'intégralité du code frontend et compilation
COPY frontend/ ./
RUN npm run build

# Étape 2 : Image d'exécution légère avec Nginx
FROM nginx:alpine

# Copie du résultat de la compilation Angular
COPY --from=build /app/dist/dispd/browser /usr/share/nginx/html

# Configuration Nginx personnalisée avec proxy vers Laravel
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


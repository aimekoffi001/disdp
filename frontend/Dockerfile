# Image d'exécution légère avec Nginx pour Angular
FROM nginx:alpine

# Copie du résultat de la compilation Angular
COPY dist/dispd/browser /usr/share/nginx/html

# Configuration Nginx personnalisée avec proxy vers Laravel
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

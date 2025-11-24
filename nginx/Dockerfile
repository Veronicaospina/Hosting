FROM nginx:alpine

# Crear directorio para configuraciones dinámicas
RUN mkdir -p /etc/nginx/conf.d/projects

# Copiar configuración principal
COPY nginx.conf /etc/nginx/nginx.conf

# Script para recargar configuración
RUN echo '#!/bin/sh\nnginx -s reload' > /usr/local/bin/reload-nginx && \
    chmod +x /usr/local/bin/reload-nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


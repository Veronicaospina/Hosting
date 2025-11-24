#!/bin/sh
set -e

# Si node_modules no existe o está vacío, instalar dependencias
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "Instalando dependencias de Node.js..."
  npm install
fi

# Ejecutar el comando principal
exec "$@"


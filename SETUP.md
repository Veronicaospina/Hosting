# Guía de Configuración e Instalación

Esta guía detallada te ayudará a configurar y ejecutar la plataforma de hosting desde cero.

## Requisitos Previos

### Software Necesario

1. **Docker** (versión 20.10 o superior)
   - Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: Instalar Docker Engine
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   ```

2. **Git** (para clonar repositorios)
   ```bash
   # Verificar instalación
   git --version
   ```

3. **Node.js** (opcional, solo para desarrollo local)
   - Versión 18 o superior
   - [Descargar Node.js](https://nodejs.org/)

### Verificar Instalación

```bash
docker --version
docker-compose --version
git --version
```

## Configuración de Roble OAuth2

### Paso 1: Registrar Aplicación en Roble

1. Acceder a la consola de desarrolladores de Roble
2. Crear nueva aplicación OAuth2
3. Configurar:
   - **Nombre**: Plataforma de Hosting
   - **Redirect URI**: `http://localhost/api/auth/callback`
   - **Scopes**: `read` (o los necesarios según la API de Roble)

### Paso 2: Obtener Credenciales

- **Client ID**: Copiar de la consola
- **Client Secret**: Copiar de la consola (guardar de forma segura)

### Paso 3: Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Backend
JWT_SECRET=generar-un-secret-aleatorio-aqui
NODE_ENV=production
PORT=3000

# Roble OAuth2
ROBLE_BASE_URL=https://roble.openlab.uninorte.edu.co
ROBLE_CLIENT_ID=tu-client-id-aqui
ROBLE_CLIENT_SECRET=tu-client-secret-aqui
ROBLE_REDIRECT_URI=http://localhost/api/auth/callback

# Frontend
REACT_APP_API_URL=http://localhost/api
REACT_APP_ROBLE_URL=https://roble.openlab.uninorte.edu.co
REACT_APP_ROBLE_CLIENT_ID=tu-client-id-aqui
```

### Generar JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# O usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Instalación

### Paso 1: Clonar Repositorio

```bash
git clone <url-del-repositorio>
cd Hosting
```

### Paso 2: Configurar Variables de Entorno

Copiar `.env.example` a `.env` y completar:

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### Paso 3: Construir y Ejecutar

```bash
# Construir imágenes y levantar contenedores
docker-compose up --build

# O en modo detached (segundo plano)
docker-compose up -d --build
```

### Paso 4: Verificar Instalación

1. **Health Check del Backend**:
   ```bash
   curl http://localhost/api/health
   ```
   Debe retornar: `{"status":"ok","timestamp":"..."}`

2. **Acceder al Frontend**:
   Abrir navegador en: http://localhost

3. **Ver Logs**:
   ```bash
   docker-compose logs -f
   ```

## Configuración de Docker en Linux

### Agregar Usuario al Grupo Docker

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Verificar Permisos

```bash
docker ps
# No debe pedir sudo
```

## Solución de Problemas

### Error: "Cannot connect to Docker daemon"

**Solución**:
```bash
# Verificar que Docker está corriendo
sudo systemctl status docker

# Iniciar Docker si está detenido
sudo systemctl start docker

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Error: "Port already in use"

**Solución**:
- Verificar qué proceso usa el puerto:
  ```bash
  # Linux/Mac
  lsof -i :80
  # Windows
  netstat -ano | findstr :80
  ```
- Cambiar puertos en `docker-compose.yml` si es necesario

### Error: "Permission denied" al clonar repositorios

**Solución**:
- Verificar que Git está instalado en el contenedor
- Verificar permisos del volumen `repos`

### Error: "Nginx configuration test failed"

**Solución**:
```bash
# Verificar configuración de Nginx
docker exec hosting-nginx nginx -t

# Ver logs de Nginx
docker logs hosting-nginx
```

### Contenedores no se inician

**Solución**:
```bash
# Ver logs detallados
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx

# Reiniciar todo
docker-compose down
docker-compose up --build
```

## Desarrollo Local

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend disponible en: http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend disponible en: http://localhost:3000 (si se configura proxy)

### Con Docker

```bash
# Reconstruir solo un servicio
docker-compose build backend
docker-compose up backend

# Ver logs en tiempo real
docker-compose logs -f backend
```

## Testing

### Probar Autenticación

1. Acceder a http://localhost
2. Hacer clic en "Iniciar sesión con Roble"
3. Completar flujo OAuth
4. Verificar que se redirige al dashboard

### Probar Creación de Proyecto

1. Crear proyecto desde template
2. Verificar que se clona el repositorio
3. Verificar que se construye la imagen
4. Verificar que se inicia el contenedor
5. Acceder al subdominio del proyecto

### Probar Apagado Automático

1. Crear proyecto
2. Esperar 30 minutos sin acceder
3. Verificar que el contenedor se apaga:
   ```bash
   docker ps -a | grep nombre-proyecto
   ```
4. Acceder al subdominio
5. Verificar que el contenedor se reinicia automáticamente

## Producción

### Consideraciones para Producción

1. **HTTPS**: Configurar certificados SSL/TLS
2. **Base de Datos**: Implementar PostgreSQL o MongoDB
3. **Backup**: Sistema de backup automático
4. **Monitoring**: Herramientas de monitoreo (Prometheus, Grafana)
5. **Logging**: Sistema centralizado de logs
6. **Security**: Revisar y fortalecer configuración de seguridad

### Variables de Entorno en Producción

- Usar gestores de secretos (AWS Secrets Manager, HashiCorp Vault)
- No commitear `.env` al repositorio
- Rotar credenciales regularmente

## Comandos Útiles

```bash
# Ver estado de contenedores
docker-compose ps

# Detener todo
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir sin caché
docker-compose build --no-cache

# Ver logs de un servicio específico
docker-compose logs -f backend

# Ejecutar comando en contenedor
docker-compose exec backend sh

# Limpiar recursos no utilizados
docker system prune -a
```

## Soporte

Para problemas o preguntas:
1. Revisar logs: `docker-compose logs`
2. Verificar documentación en README.md
3. Consultar ARCHITECTURE.md para detalles técnicos


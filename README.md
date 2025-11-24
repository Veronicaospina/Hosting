# Plataforma de Hosting Basada en Contenedores

Plataforma de hosting de páginas web basada en contenedores Docker que permite a los usuarios desplegar sus sitios web desde repositorios de GitHub con autenticación mediante Roble.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Templates](#templates)
- [Documentación Técnica](#documentación-técnica)
- [Seguridad](#seguridad)
- [Optimización de Recursos](#optimización-de-recursos)

## 🎯 Descripción General

Esta plataforma permite a los usuarios autenticados mediante Roble crear y gestionar proyectos web que se despliegan automáticamente en contenedores Docker. Cada proyecto es accesible mediante un subdominio local único: `http://nombreProyecto.nombreUsuario.localhost`

## ✨ Características

- **Autenticación con Roble**: Integración completa con el sistema de autenticación de la universidad
- **Despliegue Automático**: Clonado y despliegue automático desde repositorios de GitHub
- **Templates Predefinidos**: Tres templates dockerizados listos para usar
- **Gestión de Recursos**: Control de CPU, memoria y rate limiting
- **Apagado Automático**: Contenedores inactivos se apagan después de 30 minutos
- **Reinicio Automático**: Los contenedores se reinician automáticamente al recibir solicitudes
- **Reverse Proxy**: Nginx gestiona el enrutamiento mediante subdominios

## 🏗️ Arquitectura

### Componentes Principales

1. **Backend (Node.js/Express)**
   - API REST para gestión de proyectos y contenedores
   - Integración con la API de autenticación Roble
   - Gestión de contenedores Docker mediante Dockerode
   - Sistema de cron jobs para apagado automático

2. **Frontend (React)**
   - Interfaz de usuario moderna y responsive
   - Gestión de proyectos y autenticación
   - Dashboard personalizado por usuario

3. **Nginx (Reverse Proxy)**
   - Enrutamiento mediante subdominios dinámicos
   - Rate limiting por IP y por proyecto
   - Logging de actividad

4. **Docker**
   - Contenedores aislados por proyecto
   - Límites de recursos (CPU y memoria)
   - Gestión del ciclo de vida de contenedores

### Diagrama de Arquitectura

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Nginx (Reverse Proxy)       │
│  - Rate Limiting                    │
│  - Subdomain Routing                │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│  Frontend   │  │   Backend    │
│   (React)   │  │ (Node.js)    │
└─────────────┘  └──────┬───────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Docker Engine   │
              │ - Containers    │
              │ - Images        │
              └─────────────────┘
```

## 📦 Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Node.js 18+ (para desarrollo local)
- Acceso a la API de autenticación de Roble (dbName y credenciales del proyecto)

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd Hosting
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Backend
JWT_SECRET=tu-secret-key-super-segura
NODE_ENV=production
PORT=3000

# Roble Auth API
ROBLE_AUTH_BASE_URL=https://roble-api.openlab.uninorte.edu.co/auth
ROBLE_DB_NAME=token_contract_xyz

# Frontend
REACT_APP_API_URL=http://localhost/api
```

### 3. Construir y Ejecutar

```bash
docker-compose up --build
```

La plataforma estará disponible en:
- Frontend: http://localhost
- Backend API: http://localhost/api
- Health Check: http://localhost/api/health

## ⚙️ Configuración

### Configuración de Roble

1. Solicita al equipo de Roble el `dbName` (contrato) asignado para tu proyecto.
2. Verifica que tienes credenciales de usuario válidas en ese contrato para realizar pruebas.
3. Actualiza las variables de entorno `ROBLE_AUTH_BASE_URL` (opcional si usas la URL por defecto) y `ROBLE_DB_NAME`.

### Configuración de Docker

El sistema requiere acceso al socket de Docker. En Linux, el usuario debe estar en el grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

En Windows/Mac, Docker Desktop debe estar ejecutándose.

## 📖 Uso

### 1. Autenticación

1. Acceder a http://localhost
2. Introducir tu correo institucional y contraseña asociada al contrato de Roble
3. Presionar "Iniciar sesión"
4. Al autenticarse correctamente se mostrará el dashboard de proyectos

### 2. Crear un Proyecto

1. En el dashboard, hacer clic en "Nuevo Proyecto"
2. Completar el formulario:
   - **Nombre del Proyecto**: Nombre único (ej: `mi-sitio-web`)
   - **URL del Repositorio**: URL completa de GitHub (ej: `https://github.com/usuario/repo`)
   - **Template**: Seleccionar uno de los templates disponibles
3. Hacer clic en "Crear Proyecto"
4. El sistema clonará el repositorio, construirá la imagen Docker y desplegará el contenedor

### 3. Acceder al Proyecto

Una vez desplegado, el proyecto será accesible en:
```
http://nombreProyecto.nombreUsuario.localhost
```

### 4. Gestionar Proyectos

- **Ver Proyectos**: Lista de todos los proyectos del usuario
- **Reiniciar Contenedor**: Reinicia el contenedor si está detenido
- **Eliminar Proyecto**: Elimina el proyecto y su contenedor

## 🎨 Templates

La plataforma incluye tres templates predefinidos:

### Template 1: Sitio Estático (HTML + CSS + JS)

**Repositorio**: [Enlace al repositorio del template estático](https://github.com/tu-usuario/template-static)

**Dockerfile**:
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

### Template 2: Aplicación React

**Repositorio**: [Enlace al repositorio del template React](https://github.com/tu-usuario/template-react)

**Dockerfile**:
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
```

### Template 3: Aplicación Flask (Python)

**Repositorio**: [Enlace al repositorio del template Flask](https://github.com/tu-usuario/template-flask)

**Dockerfile**:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

**Nota**: Los enlaces a los repositorios de los templates deben ser actualizados con los repositorios reales creados por el equipo.

## 📚 Documentación Técnica

### Flujo de Trabajo del Sistema

1. **Autenticación**:
   - Usuario inicia sesión con Roble OAuth2
   - Backend intercambia código por token de acceso
   - Se genera JWT para la sesión

2. **Creación de Proyecto**:
   - Usuario proporciona nombre, URL de GitHub y template
   - Backend valida los datos
   - Sistema clona el repositorio
   - Se construye la imagen Docker
   - Se crea y inicia el contenedor con límites de recursos
   - Se actualiza la configuración de Nginx con el nuevo subdominio
   - Se recarga Nginx

3. **Gestión de Contenedores**:
   - Cada contenedor tiene límites: 512MB RAM, 0.5 CPU
   - Se registra la última actividad
   - Cron job verifica contenedores inactivos cada 5 minutos
   - Contenedores inactivos > 30 minutos se apagan
   - Al recibir solicitud, el contenedor se reinicia automáticamente

4. **Acceso a Proyectos**:
   - Nginx recibe solicitud en subdominio
   - Verifica rate limiting
   - Enruta al contenedor correspondiente
   - Registra actividad en logs

### Estrategia de Seguridad

1. **Autenticación y Autorización**:
   - OAuth2 con Roble para autenticación
   - JWT para sesiones
   - Verificación de tokens en cada request protegido
   - Usuarios solo pueden acceder a sus propios proyectos

2. **Rate Limiting**:
   - API: 10 requests/minuto por IP
   - Creación de proyectos: 3 proyectos/hora por usuario
   - Aplicaciones: 30 requests/minuto por IP

3. **Aislamiento de Contenedores**:
   - Cada proyecto en contenedor separado
   - Límites estrictos de recursos
   - Sin acceso entre contenedores

4. **Validación de Entrada**:
   - Validación de URLs de GitHub
   - Sanitización de nombres de proyectos
   - Verificación de templates válidos

### Optimización de Recursos

1. **Límites de Recursos por Contenedor**:
   - Memoria: 512MB máximo
   - CPU: 0.5 cores (50% de un core)
   - Sin swap para evitar degradación

2. **Apagado Automático**:
   - Contenedores inactivos > 30 minutos se apagan
   - Ahorro de recursos del sistema
   - Reinicio automático al recibir solicitudes

3. **Gestión de Imágenes**:
   - Imágenes construidas por proyecto
   - Limpieza periódica de imágenes no utilizadas (implementar en producción)

4. **Monitoreo**:
   - Logs de actividad por proyecto
   - Tracking de uso de recursos
   - Métricas de rendimiento

## 🔧 Desarrollo

### Estructura del Proyecto

```
Hosting/
├── backend/
│   ├── src/
│   │   ├── routes/          # Rutas de la API
│   │   ├── services/         # Lógica de negocio
│   │   ├── middleware/       # Middlewares (auth, rate limiting)
│   │   └── app.js           # Aplicación principal
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── context/         # Context API
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   ├── nginx.conf           # Configuración principal
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Comandos de Desarrollo

```bash
# Desarrollo local del backend
cd backend
npm install
npm run dev

# Desarrollo local del frontend
cd frontend
npm install
npm start

# Ejecutar todo con Docker
docker-compose up --build

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down
```

## 🧪 Testing

Para probar la plataforma:

1. **Autenticación**: Verificar login con Roble
2. **Creación de Proyecto**: Crear proyecto desde template
3. **Acceso**: Verificar que el proyecto es accesible en el subdominio
4. **Apagado Automático**: Esperar 30 minutos y verificar que el contenedor se apaga
5. **Reinicio Automático**: Acceder al proyecto apagado y verificar que se reinicia

## 📝 Notas Adicionales

- Los contenedores se ejecutan en la red `hosting-network` creada por Docker Compose
- Los logs de Nginx se almacenan en `/var/log/nginx/` dentro del contenedor
- Los repositorios clonados se almacenan en el volumen `repos`
- Las configuraciones dinámicas de Nginx se guardan en el volumen `nginx-configs`

## 🎥 Video de Demostración

[Enlace al video de YouTube con la demostración completa](https://youtube.com/watch?v=...)

El video debe mostrar:
1. Registro e inicio de sesión con Roble
2. Creación y despliegue de un proyecto
3. Funcionamiento de la gestión de recursos y apagado automático

## 👥 Autores

- [Nombres del equipo]

## 📄 Licencia

Este proyecto es parte del curso de Estructura del Computador II de la Universidad del Norte.

---

**Nota**: Este proyecto es una implementación académica. Para uso en producción, se recomienda:
- Implementar base de datos persistente (PostgreSQL/MongoDB)
- Agregar HTTPS/TLS
- Implementar backup y recuperación
- Mejorar el sistema de logging y monitoreo
- Agregar tests automatizados
- Implementar CI/CD


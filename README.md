# Plataforma de Hosting Basada en Contenedores

### Hecho por Verónica Ospina Monsalve y Hernando Boris Barreto Arenas


Este proyecto consiste en una plataforma de hosting basada en contenedores. Permite a los usuarios desplegar proyectos de repositorios de github propios basados en repositorios tipo template accesibles desde la plataforma. Se conecta con el servicio de autenticación de Roble para signup y login de usuarios. Cada usuario tiene acceso únicamente a los proyectos que él mismo cree dentro de su perfil. 
https://www.youtube.com/watch?v=Vb9e_-rjBSY

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
- [Video de Demostración](video-de-demostración)


## 🎯 Descripción General

Esta plataforma permite a los usuarios crear y gestionar proyectos web que se despliegan automáticamente en contenedores Docker. Cada proyecto es accesible mediante un subdominio local único: `http://nombreProyecto.nombreUsuario.localhost`

## ✨ Características

- **Autenticación con Roble**: Integración completa con el sistema de autenticación de la universidad
- **Despliegue Automático**: Una vez creado el proyecto, se despliega automáticamente en un contenedor lo que hay en el repositorio de GitHub adjuntado.
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


## 📦 Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Node.js 18+ (para desarrollo local)
- Acceso a la API de autenticación de Roble (dbName definido en .env y credenciales del proyecto)

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
JWT_SECRET=tu-secret-key-super-segura-cambiar-en-produccion
NODE_ENV=production
PORT=3000

# Roble Auth API
ROBLE_AUTH_BASE_URL=https://roble-api.openlab.uninorte.edu.co/auth
ROBLE_DB_NAME=plataformahosting_4ec2c35402
```

### 3. Construir y Ejecutar

```bash
docker-compose up --build
```

La plataforma estará disponible en:
- Frontend: http://localhost

## ⚙️ Configuración

### Configuración de Roble

1. Verifica en Roble el `dbName` (contrato) asignado para tu proyecto.
2. Verifica que tienes credenciales de usuario válidas en ese contrato para realizar pruebas.
3. Actualiza las variables de entorno en el `.env`.

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
2. Selecciona el Template que desees y clona el repositorio.
3. Completar el formulario:
   - **Nombre del Proyecto**: Nombre único (ej: `mi-sitio-web`)
   - **URL del Repositorio**: URL completa de GitHub (ej: `https://github.com/usuario/repo`)
4. Hacer clic en "Crear Proyecto"
5. El sistema construirá la imagen Docker y desplegará el contenedor con tu proyecto.

### 3. Acceder al Proyecto

Una vez desplegado, el proyecto será accesible en:
```
http://nombreProyecto.nombreUsuario.localhost
```

### 4. Gestionar Proyectos

- **Reiniciar**: Reinicia el contenedor si está detenido
- **Eliminar**: Elimina el proyecto y su contenedor
- **Detener**: Detiene el contenedor si está corriendo

## 🎨 Templates

La plataforma incluye tres templates predefinidos:

### Template 1: Sitio Estático (HTML + CSS + JS)

**Repositorio**: [https://github.com/Veronicaospina/static-template](https://github.com/Veronicaospina/static-template)

### Template 2: Aplicación React

**Repositorio**: [https://github.com/Veronicaospina/react-template](https://github.com/Veronicaospina/react-template)

### Template 3: Aplicación Flask (Python)

**Repositorio**: [https://github.com/Veronicaospina/flask-template](https://github.com/Veronicaospina/flask-template)


## 📚 Documentación Técnica

### Flujo de Trabajo del Sistema

1. **Autenticación**:
   - Usuario inicia sesión con Roble
   - Backend intercambia código por token de acceso
   - Se genera JWT para la sesión

2. **Creación de Proyecto**:
   - Usuario proporciona nombre, URL de GitHub y template
   - Backend valida los datos (si el nombre es único y si es un repositorio existente)
   - Sistema construye la imagen Docker que despliega el repositorio
   - Se crea y se inicia el contenedor con límites de recursos
   - Se actualiza la configuración de Nginx con el nuevo subdominio
   - Se recarga Nginx

3. **Gestión de Contenedores**:
   - Cada contenedor tiene límites
   - Se registra la última actividad
   - Cron job verifica contenedores inactivos cada 5 minutos
   - Contenedores inactivos > 30 minutos se apagan
   - Al recibir solicitud, el contenedor se reinicia automáticamente

4. **Acceso a Proyectos**:
   - Nginx recibe solicitud en subdominio
   - Verifica rate limiting
   - Enruta al contenedor correspondiente
   - Registra actividad en logs



## Estrategia de Seguridad

### 🔹 Autenticación Stateless (JWT)
- *Implementación:* auth.js
- *Detalle:*  
  Se usa jsonwebtoken para firmar tokens de sesión.  
  Al ser stateless, el backend no necesita consultar la BD ni el servicio externo Roble en cada petición → menor latencia y mayor independencia.  
  El token expira en *24h* para mitigar riesgos por robo de sesión.

---

### 🔹 Protección contra Abusos (Rate Limiting)
- *Implementación:* middleware/rateLimiter.js
- *Detalle:*
  - Defensa General → *10 requests/min por IP*.
  - Defensa Específica → *3 proyectos/hora por usuario* para evitar spam de contenedores.

---

### 🔹 Validación de Entradas Externas
- *Implementación:* routes/projects.js
- *Detalle:*  
  Se valida que la URL pertenezca a GitHub (https://github.com/) y sea accesible mediante request HEAD antes de clonar.  
  Previene inyección de comandos y accesos a recursos internos.

---

### 🔹 Aislamiento de Entornos
- *Implementación:* Docker
- *Detalle:*  
  Cada proyecto corre en un *contenedor aislado*.  
  Si uno falla o es comprometido, no afecta al backend ni a otros contenedores.

---

## 2. Estrategia de Optimización de Recursos

### 🔹 Gestión de Ciclo de Vida (Auto-Apagado)
- *Implementación:* services/dockerService.js (shutdownInactiveContainers)
- *Detalle:*  
  Si un contenedor no tiene actividad por *30 min*, se apaga automáticamente.  
  Reduce consumo de *RAM y CPU* liberando recursos para hosting.

---

### 🔹 Imágenes Docker Ligeras (Alpine)
- *Implementación:* Dockerfile (Frontend, Backend y Nginx)
- *Detalle:*  
  Se usa Alpine (node:18-alpine, nginx:alpine).  
  Pesan ~5–10MB frente a más de 100MB de las imágenes completas → despliegue más rápido y menor uso de disco.

---

### 🔹 Builds Multi-etapa
- *Implementación:* Dockerfile
- *Detalle:*  
  El build de React se genera en una etapa (AS build) y luego se copian solo los archivos estáticos a una imagen Nginx final.  
  No se incluyen node_modules ni código fuente → imagen de producción mucho más pequeña.

---

### 🔹 Limpieza de Estado (Garbage Collection Lógica)
- *Implementación:* services/dockerService.js (removeContainer)
- *Detalle:*  
  El sistema limpia:
  - Memoria (containerActivity)
  - Configuraciones Nginx huérfanas  
  Evita fugas de memoria y mantiene el backend estable a largo plazo.

## 🔧 Desarrollo



### Comandos de Desarrollo

```bash
# Ejecutar todo con Docker
docker-compose up --build

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down
```


## 📝 Notas Adicionales

- Los contenedores se ejecutan en la red `hosting-network` creada por Docker Compose
- Los logs de Nginx se almacenan en `/var/log/nginx/` dentro del contenedor
- Los repositorios clonados se almacenan en el volumen `repos`
- Las configuraciones dinámicas de Nginx se guardan en el volumen `nginx-configs`

## 🎥 Video de Demostración

[Enlace al video de YouTube con la demostración completa](https://www.youtube.com/watch?v=Vb9e_-rjBSY)

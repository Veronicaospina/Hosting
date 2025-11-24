# Documentación Técnica - Arquitectura del Sistema

## Descripción de la Arquitectura

La plataforma de hosting está diseñada con una arquitectura modular basada en microservicios, donde cada componente tiene responsabilidades específicas y se comunica con los demás mediante APIs bien definidas.

## Componentes del Sistema

### 1. Backend (Node.js/Express)

**Responsabilidades:**
- Gestión de autenticación con Roble OAuth2
- API REST para operaciones CRUD de proyectos
- Gestión del ciclo de vida de contenedores Docker
- Monitoreo y control de recursos
- Tareas programadas (cron jobs)

**Tecnologías:**
- Node.js 18+
- Express.js
- Dockerode (cliente Docker)
- JWT para sesiones
- node-cron para tareas programadas

**Endpoints Principales:**
- `POST /api/auth/login` - Autenticación con Roble
- `GET /api/projects` - Listar proyectos del usuario
- `POST /api/projects` - Crear nuevo proyecto
- `DELETE /api/projects/:id` - Eliminar proyecto
- `POST /api/projects/:id/restart` - Reiniciar contenedor

### 2. Frontend (React)

**Responsabilidades:**
- Interfaz de usuario para gestión de proyectos
- Autenticación y gestión de sesión
- Visualización de estado de proyectos
- Formularios para creación de proyectos

**Tecnologías:**
- React 18
- React Router para navegación
- Axios para comunicación con API
- Context API para estado global

**Componentes Principales:**
- `Login` - Autenticación con Roble
- `Dashboard` - Layout principal
- `ProjectList` - Lista de proyectos
- `ProjectForm` - Formulario de creación

### 3. Nginx (Reverse Proxy)

**Responsabilidades:**
- Enrutamiento de solicitudes HTTP
- Gestión de subdominios dinámicos
- Rate limiting por IP y por aplicación
- Logging de actividad

**Configuración:**
- Configuración base en `nginx/nginx.conf`
- Configuraciones dinámicas en `/etc/nginx/conf.d/projects/`
- Rate limiting configurado por zonas

### 4. Docker Engine

**Responsabilidades:**
- Ejecución de contenedores aislados
- Gestión de imágenes Docker
- Control de recursos (CPU, memoria)

**Configuración de Contenedores:**
- Memoria máxima: 512MB
- CPU: 0.5 cores (50% de un core)
- Red: `hosting-network`
- Política de reinicio: `unless-stopped`

## Flujo de Trabajo del Sistema

### Flujo de Autenticación

```
Usuario → Frontend → Roble OAuth → Backend → JWT Token → Frontend
```

1. Usuario hace clic en "Iniciar sesión con Roble"
2. Frontend redirige a Roble con parámetros OAuth2
3. Usuario autoriza en Roble
4. Roble redirige con código de autorización
5. Frontend envía código al backend
6. Backend intercambia código por token de acceso
7. Backend genera JWT y lo retorna
8. Frontend almacena JWT en localStorage

### Flujo de Creación de Proyecto

```
Usuario → Frontend → Backend → Docker Service → GitHub → Docker Build → Container Start → Nginx Config
```

1. Usuario completa formulario de proyecto
2. Frontend envía datos al backend
3. Backend valida datos y crea registro de proyecto
4. Docker Service clona repositorio de GitHub
5. Docker Service construye imagen desde Dockerfile
6. Docker Service crea contenedor con límites de recursos
7. Docker Service inicia contenedor
8. Docker Service actualiza configuración de Nginx
9. Nginx se recarga para aplicar cambios
10. Proyecto queda accesible en subdominio

### Flujo de Acceso a Proyecto

```
Cliente → Nginx → Rate Limiting Check → Container (si está corriendo) → Response
                                      ↓ (si está detenido)
                                   Container Start → Response
```

1. Cliente solicita `http://proyecto.usuario.localhost`
2. Nginx verifica rate limiting
3. Nginx enruta a contenedor correspondiente
4. Si contenedor está detenido, se reinicia automáticamente
5. Se registra actividad del contenedor
6. Respuesta se retorna al cliente

### Flujo de Apagado Automático

```
Cron Job (cada 5 min) → Verificar Inactividad → Si > 30 min → Stop Container
```

1. Cron job se ejecuta cada 5 minutos
2. Verifica última actividad de cada contenedor
3. Si inactivo > 30 minutos, detiene contenedor
4. Registra evento en logs

## Estrategia de Seguridad

### Autenticación y Autorización

1. **OAuth2 con Roble**: Autenticación centralizada y segura
2. **JWT Tokens**: Tokens firmados con expiración de 24 horas
3. **Verificación de Propiedad**: Usuarios solo acceden a sus proyectos
4. **HTTPS Ready**: Preparado para implementar TLS/SSL

### Aislamiento

1. **Contenedores Aislados**: Cada proyecto en contenedor separado
2. **Límites de Recursos**: Prevención de consumo excesivo
3. **Red Aislada**: Contenedores en red Docker privada
4. **Sin Acceso Root**: Contenedores ejecutan con usuarios no privilegiados

### Rate Limiting

1. **API**: 10 requests/minuto por IP
2. **Creación de Proyectos**: 3 proyectos/hora por usuario
3. **Aplicaciones**: 30 requests/minuto por IP
4. **Burst Allowance**: Permite picos controlados

### Validación de Entrada

1. **Sanitización**: Nombres de proyectos validados
2. **URL Validation**: Verificación de URLs de GitHub
3. **Template Validation**: Solo templates predefinidos permitidos
4. **SQL Injection Prevention**: Uso de parámetros preparados (cuando se use DB)

## Optimización de Recursos

### Gestión de Memoria

- Límite de 512MB por contenedor
- Sin swap para evitar degradación
- Monitoreo de uso de memoria

### Gestión de CPU

- Límite de 0.5 cores por contenedor
- CPU shares para distribución equitativa
- Throttling automático cuando se excede

### Apagado Automático

- Contenedores inactivos > 30 minutos se apagan
- Ahorro significativo de recursos
- Reinicio bajo demanda

### Limpieza de Recursos

- Imágenes no utilizadas (implementar en producción)
- Logs rotados automáticamente
- Volúmenes temporales limpiados

## Monitoreo y Logging

### Logs del Sistema

- **Backend**: Logs de aplicación en stdout
- **Nginx**: Access logs y error logs por proyecto
- **Docker**: Logs de contenedores disponibles via `docker logs`

### Métricas

- Actividad de contenedores
- Uso de recursos por contenedor
- Tasa de requests por proyecto
- Tiempo de inactividad

## Escalabilidad

### Horizontal Scaling

- Backend puede escalarse horizontalmente
- Nginx puede balancear carga entre instancias
- Contenedores de proyectos son independientes

### Vertical Scaling

- Aumentar límites de recursos por contenedor
- Aumentar recursos del servidor host
- Optimizar configuración de Docker

## Consideraciones para Producción

1. **Base de Datos**: Implementar PostgreSQL o MongoDB para persistencia
2. **HTTPS**: Configurar certificados SSL/TLS
3. **Backup**: Sistema de backup de configuraciones y datos
4. **Monitoring**: Integrar herramientas como Prometheus/Grafana
5. **Alerting**: Sistema de alertas para errores críticos
6. **CI/CD**: Pipeline de despliegue automatizado
7. **Testing**: Suite de tests automatizados
8. **Documentation**: Documentación API con Swagger/OpenAPI


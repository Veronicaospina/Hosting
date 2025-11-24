# Templates Dockerizados

Este documento describe los tres templates disponibles para crear proyectos en la plataforma de hosting.

## Template 1: Sitio Estático (HTML + CSS + JS)

### Descripción
Template para sitios web estáticos que solo requieren HTML, CSS y JavaScript del lado del cliente.

### Estructura del Repositorio

```
template-static/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── Dockerfile
└── README.md
```

### Dockerfile

```dockerfile
FROM nginx:alpine

# Copiar archivos estáticos al directorio de Nginx
COPY . /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Nginx se inicia automáticamente
CMD ["nginx", "-g", "daemon off;"]
```

### Requisitos

- Archivo `index.html` en la raíz
- Dockerfile funcional
- Repositorio público en GitHub

### Ejemplo de Uso

1. Clonar el template: `git clone https://github.com/tu-usuario/template-static.git`
2. Modificar contenido HTML/CSS/JS
3. Hacer commit y push a GitHub
4. Registrar en la plataforma con la URL del repositorio

## Template 2: Aplicación React

### Descripción
Template para aplicaciones React que se construyen y sirven como sitio estático.

### Estructura del Repositorio

```
template-react/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
├── Dockerfile
└── README.md
```

### Dockerfile

```dockerfile
# Etapa de construcción
FROM node:18-alpine as builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar build al directorio de Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración personalizada de Nginx (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### package.json (ejemplo)

```json
{
  "name": "react-app",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  }
}
```

### Requisitos

- `package.json` con script `build`
- Dockerfile multi-stage
- Repositorio público en GitHub

## Template 3: Aplicación Flask (Python)

### Descripción
Template para aplicaciones web con Flask que sirven contenido dinámico.

### Estructura del Repositorio

```
template-flask/
├── app.py
├── templates/
│   └── index.html
├── static/
│   └── style.css
├── requirements.txt
├── Dockerfile
└── README.md
```

### Dockerfile

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivo de dependencias
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Exponer puerto 5000 (puerto por defecto de Flask)
EXPOSE 5000

# Variables de entorno
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Comando para ejecutar la aplicación
CMD ["python", "app.py"]
```

### app.py (ejemplo)

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### requirements.txt (ejemplo)

```
Flask==2.3.3
Werkzeug==2.3.7
```

### Nota Importante

Para que Flask funcione correctamente con Nginx, el contenedor debe:
- Escuchar en `0.0.0.0` (no `127.0.0.1`)
- Usar el puerto 5000 o configurar Nginx para el puerto correcto

### Requisitos

- `requirements.txt` con dependencias
- `app.py` como punto de entrada
- Dockerfile funcional
- Repositorio público en GitHub

## Crear tus Propios Templates

### Pasos para Crear un Template

1. **Crear Repositorio en GitHub**
   - Crear nuevo repositorio público
   - Nombre descriptivo (ej: `template-vue`, `template-nextjs`)

2. **Estructura Básica**
   - Incluir Dockerfile funcional
   - Incluir README con instrucciones
   - Asegurar que el contenedor exponga un puerto

3. **Dockerfile Requisitos**
   - Debe construir y ejecutar la aplicación
   - Debe exponer un puerto (preferiblemente 80 o 5000)
   - Debe ser eficiente (usar multi-stage si es necesario)

4. **Probar Localmente**
   ```bash
   docker build -t test-template .
   docker run -p 8080:80 test-template
   ```
   Verificar que funciona en http://localhost:8080

5. **Documentar**
   - README con instrucciones
   - Ejemplos de uso
   - Requisitos del sistema

### Buenas Prácticas

- **Optimización de Imágenes**: Usar imágenes base pequeñas (alpine)
- **Caché de Capas**: Ordenar Dockerfile para maximizar caché
- **Multi-stage Builds**: Para aplicaciones compiladas
- **Variables de Entorno**: Usar ENV para configuración
- **Health Checks**: Incluir HEALTHCHECK en Dockerfile
- **No Root User**: Ejecutar como usuario no privilegiado cuando sea posible

## Enlaces a Repositorios de Templates

Una vez creados los templates, actualizar estos enlaces en el README principal:

- **Template Estático**: [https://github.com/tu-usuario/template-static](https://github.com/tu-usuario/template-static)
- **Template React**: [https://github.com/tu-usuario/template-react](https://github.com/tu-usuario/template-react)
- **Template Flask**: [https://github.com/tu-usuario/template-flask](https://github.com/tu-usuario/template-flask)

## Notas Adicionales

- Los templates deben ser repositorios públicos o el usuario debe tener acceso
- El Dockerfile debe estar en la raíz del repositorio
- El puerto expuesto debe ser consistente (80 para HTTP, 5000 para Flask, etc.)
- Para aplicaciones que requieren variables de entorno, documentar en README


const Docker = require('dockerode');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Almacenamiento en memoria de contenedores activos (en producción usar DB)
const activeContainers = new Map();
const containerActivity = new Map(); // Timestamp de última actividad

/**
 * Crea un contenedor Docker para un proyecto
 * @param {Object} project - Información del proyecto
 * @returns {Promise<Object>} Información del contenedor creado
 */
async function createContainer(project) {
  try {
    const containerName = `${project.name}_${project.username}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const subdomain = `${project.name}.${project.username}.localhost`;
    const port = await getAvailablePort();

    // Clonar repositorio si no existe
    const repoPath = `/tmp/repos/${project.username}/${project.name}`;
    await cloneRepository(project.githubUrl, repoPath);

    // Construir imagen Docker
    const imageName = `hosting-${containerName}`;
    await buildImage(repoPath, imageName);

    // Crear contenedor con límites de recursos
    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      HostConfig: {
        Memory: 512 * 1024 * 1024, // 512MB
        MemorySwap: 512 * 1024 * 1024, // Sin swap
        CpuQuota: 50000, // 0.5 CPU (50000 microsegundos de 100000)
        CpuPeriod: 100000,
        PortBindings: {
          '80/tcp': [{ HostPort: port.toString() }]
        },
        RestartPolicy: { Name: 'unless-stopped' },
        NetworkMode: 'hosting_hosting-network' // Conectar a la red de docker-compose
      },
      Env: [
        `SUBDOMAIN=${subdomain}`,
        `PROJECT_NAME=${project.name}`
      ]
    });

    await container.start();

    // Registrar contenedor activo
    activeContainers.set(project.id, {
      id: container.id,
      name: containerName,
      port: port,
      subdomain: subdomain,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    containerActivity.set(container.id, new Date());

    // Actualizar configuración de Nginx
    await updateNginxConfig(subdomain, port);

    return {
      containerId: container.id,
      containerName: containerName,
      subdomain: subdomain,
      port: port,
      status: 'running'
    };
  } catch (error) {
    console.error('Error creando contenedor:', error);
    throw error;
  }
}

/**
 * Detiene un contenedor
 * @param {string} containerId - ID del contenedor
 */
async function stopContainer(containerId) {
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    console.log(`Contenedor ${containerId} detenido`);
  } catch (error) {
    console.error('Error deteniendo contenedor:', error);
    throw error;
  }
}

/**
 * Inicia un contenedor detenido
 * @param {string} containerId - ID del contenedor
 */
async function startContainer(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    
    if (!info.State.Running) {
      await container.start();
      console.log(`Contenedor ${containerId} iniciado`);
    }
    
    // Actualizar última actividad
    containerActivity.set(containerId, new Date());
    
    return { running: true, containerId };
  } catch (error) {
    console.error('Error iniciando contenedor:', error);
    throw error;
  }
}

/**
 * Verifica si un contenedor está inactivo y lo reinicia si es necesario
 * @param {string} containerId - ID del contenedor
 * @returns {Promise<boolean>} true si se reinició, false si no
 */
async function ensureContainerRunning(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    
    if (!info.State.Running) {
      await container.start();
      containerActivity.set(containerId, new Date());
      console.log(`Contenedor ${containerId} reiniciado automáticamente`);
      return true;
    }
    
    // Actualizar actividad
    containerActivity.set(containerId, new Date());
    return false;
  } catch (error) {
    console.error('Error verificando contenedor:', error);
    return false;
  }
}

/**
 * Elimina un contenedor
 * @param {string} containerId - ID del contenedor
 */
async function removeContainer(containerId) {
  try {
    const container = docker.getContainer(containerId);
    
    try {
      await container.stop();
    } catch (e) {
      // Ignorar si ya está detenido o no existe
    }
    
    await container.remove({ force: true });
    console.log(`Contenedor ${containerId} eliminado`);
    
    // Limpiar estado
    containerActivity.delete(containerId);
    for (const [projectId, info] of activeContainers.entries()) {
      if (info.id === containerId) {
        activeContainers.delete(projectId);
        break;
      }
    }
  } catch (error) {
    console.error('Error eliminando contenedor:', error);
    // No lanzar error si el contenedor no existe, para permitir borrar el proyecto
    if (error.statusCode === 404) {
      // Limpiar estado si no existe
      containerActivity.delete(containerId);
      for (const [projectId, info] of activeContainers.entries()) {
        if (info.id === containerId) {
          activeContainers.delete(projectId);
          break;
        }
      }
      return;
    }
    throw error;
  }
}

/**
 * Reinicia un contenedor
 * @param {string} containerId - ID del contenedor
 */
async function restartContainer(containerId) {
  try {
    const container = docker.getContainer(containerId);
    await container.restart();
    containerActivity.set(containerId, new Date());
    console.log(`Contenedor ${containerId} reiniciado`);
    return { running: true, containerId };
  } catch (error) {
    console.error('Error reiniciando contenedor:', error);
    throw error;
  }
}

/**
 * Obtiene el estado de un contenedor
 * @param {string} containerId - ID del contenedor
 * @returns {Promise<Object>} Estado del contenedor
 */
async function getContainerStatus(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return {
      id: info.Id,
      name: info.Name,
      status: info.State.Status,
      running: info.State.Running,
      startedAt: info.State.StartedAt
    };
  } catch (error) {
    console.error('Error obteniendo estado del contenedor:', error);
    throw error;
  }
}

/**
 * Registra actividad en un contenedor
 * @param {string} containerId - ID del contenedor
 */
function recordActivity(containerId) {
  containerActivity.set(containerId, new Date());
}

/**
 * Apaga contenedores inactivos por más de 30 minutos
 */
async function shutdownInactiveContainers() {
  const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutos en ms
  const now = new Date();

  for (const [containerId, lastActivity] of containerActivity.entries()) {
    const inactiveTime = now - lastActivity;
    
    if (inactiveTime > INACTIVITY_THRESHOLD) {
      try {
        const container = docker.getContainer(containerId);
        const info = await container.inspect();
        
        if (info.State.Running) {
          await container.stop();
          console.log(`Contenedor ${containerId} apagado por inactividad`);
        }
      } catch (error) {
        console.error(`Error apagando contenedor ${containerId}:`, error);
        
        // Si el contenedor no existe, limpiar del registro
        if (error.statusCode === 404) {
          console.log(`Eliminando contenedor ${containerId} del registro de actividad (no encontrado)`);
          containerActivity.delete(containerId);
          for (const [projectId, info] of activeContainers.entries()) {
            if (info.id === containerId) {
              activeContainers.delete(projectId);
              break;
            }
          }
        }
      }
    }
  }
}

/**
 * Clona un repositorio de GitHub
 * @param {string} repoUrl - URL del repositorio
 * @param {string} targetPath - Ruta destino
 */
async function cloneRepository(repoUrl, targetPath) {
  try {
    await execAsync(`mkdir -p ${targetPath}`);
    await execAsync(`git clone ${repoUrl} ${targetPath}`, {
      timeout: 60000
    });
  } catch (error) {
    // Si el directorio ya existe, hacer pull
    if (error.code === 128) {
      await execAsync(`cd ${targetPath} && git pull`, { timeout: 60000 });
    } else {
      throw error;
    }
  }
}

/**
 * Construye una imagen Docker
 * @param {string} contextPath - Ruta del contexto
 * @param {string} imageName - Nombre de la imagen
 */
async function buildImage(contextPath, imageName) {
  return new Promise((resolve, reject) => {
    docker.buildImage(
      {
        context: contextPath,
        src: ['Dockerfile', '.']
      },
      { t: imageName },
      (err, stream) => {
        if (err) return reject(err);
        
        docker.modem.followProgress(stream, (err, output) => {
          if (err) return reject(err);
          resolve(output);
        });
      }
    );
  });
}

/**
 * Obtiene un puerto disponible
 * @returns {Promise<number>} Puerto disponible
 */
async function getAvailablePort() {
  // Implementación simple: usar puertos del 8000 en adelante
  // En producción, usar un sistema más robusto
  const basePort = 8000;
  const randomOffset = Math.floor(Math.random() * 1000);
  return basePort + randomOffset;
}

/**
 * Actualiza la configuración de Nginx
 * @param {string} subdomain - Subdominio
 * @param {number} port - Puerto del contenedor
 */
async function updateNginxConfig(subdomain, port) {
  const config = `server {
    listen 80;
    server_name ${subdomain};

    # Rate limiting por proyecto
    limit_req zone=app_limit burst=10 nodelay;

    # Logging de actividad (usar formato main en lugar de activity para evitar variable no definida)
    access_log /var/log/nginx/${subdomain}.access.log main;
    error_log /var/log/nginx/${subdomain}.error.log;

    location / {
        proxy_pass http://host.docker.internal:${port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

  const configDir = '/etc/nginx/conf.d/projects';
  const configPath = path.join(configDir, `${subdomain}.conf`);
  
  try {
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configPath, config);
    console.log(`Configuración de Nginx escrita en ${configPath}`);
    
    // Recargar Nginx
    await execAsync('docker exec hosting-nginx nginx -s reload');
    console.log(`Configuración de Nginx actualizada para ${subdomain}`);
  } catch (error) {
    console.warn('Error actualizando configuración de Nginx:', error.message);
  }
}

/**
 * Elimina la configuración de Nginx para un subdominio
 * @param {string} subdomain - Subdominio
 */
async function removeNginxConfig(subdomain) {
  const configPath = path.join('/etc/nginx/conf.d/projects', `${subdomain}.conf`);
  
  try {
    await fs.unlink(configPath);
    console.log(`Configuración de Nginx eliminada: ${configPath}`);
    
    // Recargar Nginx
    await execAsync('docker exec hosting-nginx nginx -s reload');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Error eliminando configuración de Nginx:', error.message);
    }
  }
}

module.exports = {
  createContainer,
  stopContainer,
  startContainer,
  restartContainer,
  removeContainer,
  getContainerStatus,
  recordActivity,
  shutdownInactiveContainers,
  ensureContainerRunning,
  removeNginxConfig,
  activeContainers,
  containerActivity
};


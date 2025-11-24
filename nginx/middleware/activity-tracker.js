// Middleware para Nginx que registra actividad
// Este archivo es una referencia para implementar tracking de actividad
// En producción, se puede usar un script que monitoree los logs de Nginx

/**
 * Script para monitorear logs de Nginx y registrar actividad
 * Se ejecuta como servicio separado o como parte del backend
 */

const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');

const NGINX_LOG_DIR = '/var/log/nginx';
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

/**
 * Parsea los logs de Nginx y registra actividad
 */
function parseNginxLogs() {
  // Leer logs de proyectos
  fs.readdir(NGINX_LOG_DIR, (err, files) => {
    if (err) {
      console.error('Error leyendo directorio de logs:', err);
      return;
    }

    files
      .filter(file => file.endsWith('.access.log') && file.includes('.'))
      .forEach(file => {
        const subdomain = file.replace('.access.log', '');
        // Registrar actividad en el backend
        registerActivity(subdomain);
      });
  });
}

/**
 * Registra actividad para un subdominio
 */
async function registerActivity(subdomain) {
  try {
    // Extraer containerId del subdomain (nombreProyecto.nombreUsuario.localhost)
    // Esto requiere mapeo en el backend
    await axios.post(`${API_URL}/containers/activity`, {
      subdomain: subdomain,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error registrando actividad:', error);
  }
}

// Ejecutar cada minuto
setInterval(parseNginxLogs, 60000);

module.exports = { parseNginxLogs, registerActivity };


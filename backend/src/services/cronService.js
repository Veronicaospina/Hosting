const cron = require('node-cron');
const dockerService = require('./dockerService');

/**
 * Inicia el servicio de cron para tareas programadas
 */
function startCronJobs() {
  // Apagar contenedores inactivos cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log('Ejecutando limpieza de contenedores inactivos...');
    try {
      await dockerService.shutdownInactiveContainers();
    } catch (error) {
      console.error('Error en limpieza de contenedores:', error);
    }
  });

  console.log('Servicios de cron iniciados');
}

module.exports = {
  startCronJobs
};


const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const dockerService = require('../services/dockerService');

router.use(authenticateToken);

// Registrar actividad en un contenedor
router.post('/:id/activity', async (req, res, next) => {
  try {
    dockerService.recordActivity(req.params.id);
    res.json({ message: 'Actividad registrada' });
  } catch (error) {
    next(error);
  }
});

// Obtener estado de un contenedor
router.get('/:id/status', async (req, res, next) => {
  try {
    const status = await dockerService.getContainerStatus(req.params.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

module.exports = router;


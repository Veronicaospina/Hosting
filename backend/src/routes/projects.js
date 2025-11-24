const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { projectCreationLimiter } = require('../middleware/rateLimiter');
const projectService = require('../services/projectService');
const dockerService = require('../services/dockerService');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todos los proyectos del usuario
router.get('/', async (req, res, next) => {
  try {
    const projects = await projectService.getUserProjects(req.user.username);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Obtener un proyecto específico
router.get('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user.username);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Crear un nuevo proyecto
router.post('/', projectCreationLimiter, async (req, res, next) => {
  try {
    const { name, githubUrl, template } = req.body;
    
    if (!name || !githubUrl || !template) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: name, githubUrl, template' 
      });
    }

    // Validar template
    const validTemplates = ['static', 'react', 'flask'];
    if (!validTemplates.includes(template)) {
      return res.status(400).json({ 
        error: 'Template inválido. Debe ser: static, react o flask' 
      });
    }

    const project = await projectService.createProject({
      name,
      githubUrl,
      template,
      username: req.user.username
    });

    // Desplegar contenedor
    try {
      const container = await dockerService.createContainer(project);
      project.container = container;
      await projectService.updateProject(project.id, { containerId: container.containerId });
    } catch (containerError) {
      console.error('Error desplegando contenedor:', containerError);
      // El proyecto se crea pero sin contenedor
    }

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Actualizar un proyecto
router.put('/:id', async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.body,
      req.user.username
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Eliminar un proyecto
router.delete('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user.username);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Eliminar contenedor si existe
    if (project.containerId) {
      try {
        await dockerService.removeContainer(project.containerId);
      } catch (containerError) {
        console.error('Error eliminando contenedor:', containerError);
      }
    }

    await projectService.deleteProject(req.params.id, req.user.username);
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

// Reiniciar contenedor de un proyecto
router.post('/:id/restart', async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user.username);
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!project.containerId) {
      return res.status(400).json({ error: 'El proyecto no tiene contenedor asociado' });
    }

    // Asegurar que el contenedor esté corriendo
    await dockerService.ensureContainerRunning(project.containerId);
    const status = await dockerService.getContainerStatus(project.containerId);

    res.json({ message: 'Contenedor verificado/reiniciado', status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


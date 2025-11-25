// Almacenamiento en memoria (en producción usar base de datos)
const projects = new Map();
let projectIdCounter = 1;

/**
 * Crea un nuevo proyecto
 * @param {Object} projectData - Datos del proyecto
 * @returns {Promise<Object>} Proyecto creado
 */
async function createProject(projectData) {
  const project = {
    id: projectIdCounter++,
    name: projectData.name,
    githubUrl: projectData.githubUrl,
    template: projectData.template,
    username: projectData.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    containerId: null,
    status: 'pending'
  };

  projects.set(project.id, project);
  return project;
}

/**
 * Obtiene todos los proyectos de un usuario
 * @param {string} username - Nombre de usuario
 * @returns {Promise<Array>} Lista de proyectos
 */
async function getUserProjects(username) {
  const userProjects = [];
  for (const project of projects.values()) {
    if (project.username === username) {
      userProjects.push(project);
    }
  }
  return userProjects;
}

/**
 * Obtiene un proyecto por ID
 * @param {number|string} projectId - ID del proyecto
 * @param {string} username - Nombre de usuario (para verificación)
 * @returns {Promise<Object|null>} Proyecto o null
 */
async function getProject(projectId, username) {
  const id = Number(projectId);
  const project = projects.get(id);
  if (project && project.username === username) {
    return project;
  }
  return null;
}

/**
 * Actualiza un proyecto
 * @param {number|string} projectId - ID del proyecto
 * @param {Object} updates - Campos a actualizar
 * @param {string} username - Nombre de usuario (para verificación)
 * @returns {Promise<Object|null>} Proyecto actualizado o null
 */
async function updateProject(projectId, updates, username = null) {
  const id = Number(projectId);
  const project = projects.get(id);
  
  if (!project) {
    return null;
  }

  if (username && project.username !== username) {
    return null;
  }

  Object.assign(project, updates, { updatedAt: new Date().toISOString() });
  projects.set(id, project);
  return project;
}

/**
 * Elimina un proyecto
 * @param {number|string} projectId - ID del proyecto
 * @param {string} username - Nombre de usuario (para verificación)
 * @returns {Promise<boolean>} true si se eliminó, false si no existe
 */
async function deleteProject(projectId, username) {
  const id = Number(projectId);
  const project = projects.get(id);
  
  if (!project || project.username !== username) {
    return false;
  }

  projects.delete(id);
  return true;
}

module.exports = {
  createProject,
  getUserProjects,
  getProject,
  updateProject,
  deleteProject
};


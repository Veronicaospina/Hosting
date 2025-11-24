import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './ProjectList.css';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = React.useContext(AuthContext);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto?')) {
      return;
    }

    try {
      await axios.delete(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchProjects();
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      alert('Error al eliminar el proyecto');
    }
  };

  const handleRestart = async (projectId) => {
    try {
      await axios.post(
        `/api/projects/${projectId}/restart`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert('Contenedor reiniciado correctamente');
      fetchProjects();
    } catch (error) {
      console.error('Error reiniciando contenedor:', error);
      alert('Error al reiniciar el contenedor');
    }
  };

  if (loading) {
    return <div className="loading">Cargando proyectos...</div>;
  }

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>Mis Proyectos</h2>
        <Link to="/projects/new" className="btn btn-primary">
          + Nuevo Proyecto
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No tienes proyectos aún. Crea tu primer proyecto para comenzar.</p>
          <Link to="/projects/new" className="btn btn-primary">
            Crear Proyecto
          </Link>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className={`status-badge status-${project.status}`}>
                  {project.status}
                </span>
              </div>
              
              <div className="project-info">
                <p><strong>Template:</strong> {project.template}</p>
                <p><strong>Repositorio:</strong> 
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    {project.githubUrl}
                  </a>
                </p>
                {project.container?.subdomain && (
                  <p><strong>URL:</strong> 
                    <a 
                      href={`http://${project.container.subdomain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {project.container.subdomain}
                    </a>
                  </p>
                )}
              </div>

              <div className="project-actions">
                {project.container?.subdomain && (
                  <button
                    onClick={() => handleRestart(project.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    Reiniciar
                  </button>
                )}
                <button
                  onClick={() => handleDelete(project.id)}
                  className="btn btn-danger btn-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList;


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

  const handleStop = async (projectId) => {
    try {
      const response = await axios.post(
        `/api/projects/${projectId}/stop`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setProjects(projects.map(p => {
        if (p.id === projectId) {
          return { ...p, container: { ...p.container, ...response.data.status } };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error deteniendo contenedor:', error);
      alert('Error al detener el contenedor');
    }
  };

  const handleStart = async (projectId) => {
    try {
      const response = await axios.post(
        `/api/projects/${projectId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setProjects(projects.map(p => {
        if (p.id === projectId) {
          return { ...p, container: { ...p.container, ...response.data.status } };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error iniciando contenedor:', error);
      alert('Error al iniciar el contenedor');
    }
  };

  const getStatusInfo = (project) => {
    const raw = project.container?.status || project.status || 'unknown';
    const s = String(raw).toLowerCase();

    if (s.includes('running')) {
      return { normalized: 'running', label: 'Running' };
    }
    if (s.includes('exited') || s.includes('stopped')) {
      return { normalized: 'stopped', label: 'Stopped' };
    }
    if (s.includes('pending') || s.includes('created')) {
      return { normalized: 'pending', label: 'Pending' };
    }
    if (s.includes('restarting')) {
      return { normalized: 'restarting', label: 'Restarting' };
    }
    if (s.includes('paused')) {
      return { normalized: 'paused', label: 'Paused' };
    }

    // Fallback: use the raw value, normalized for classname
    const normalized = s.replace(/\s+/g, '-');
    const label = String(raw).charAt(0).toUpperCase() + String(raw).slice(1);
    return { normalized, label };
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
                {(() => {
                  const { normalized, label } = getStatusInfo(project);
                  return (
                    <span className={`status-badge status-${normalized}`}>
                      {label}
                    </span>
                  );
                })()}
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
                  <>
                    {(() => {
                      const { normalized } = getStatusInfo(project);
                      if (normalized === 'running') {
                        return (
                          <button
                            onClick={() => handleStop(project.id)}
                            className="btn btn-warning btn-sm"
                          >
                            Detener
                          </button>
                        );
                      } else if (normalized === 'stopped') {
                        return (
                          <button
                            onClick={() => handleStart(project.id)}
                            className="btn btn-success btn-sm"
                          >
                            Iniciar
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button
                      onClick={() => handleRestart(project.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      Reiniciar
                    </button>
                  </>
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


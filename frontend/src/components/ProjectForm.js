import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './ProjectForm.css';

function ProjectForm() {
  const [formData, setFormData] = useState({
    name: '',
    githubUrl: '',
    template: 'static'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        '/api/projects',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      navigate('/', { state: { message: 'Proyecto creado correctamente' } });
    } catch (error) {
      setError(error.response?.data?.error || 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <div className="card">
        <h2>Crear Nuevo Proyecto</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre del Proyecto *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="mi-proyecto"
            />
            <small>El nombre debe ser único y solo contener letras, números y guiones</small>
          </div>

          <div className="form-group">
            <label htmlFor="githubUrl">URL del Repositorio GitHub *</label>
            <input
              type="url"
              id="githubUrl"
              name="githubUrl"
              value={formData.githubUrl}
              onChange={handleChange}
              required
              placeholder="https://github.com/usuario/repositorio"
            />
            <small>Asegúrate de que el repositorio sea público o tengas acceso</small>
          </div>

          <div className="form-group">
            <label htmlFor="template">Template *</label>
            <select
              id="template"
              name="template"
              value={formData.template}
              onChange={handleChange}
              required
            >
              <option value="static">Sitio Estático (HTML + CSS + JS)</option>
              <option value="react">Aplicación React</option>
              <option value="flask">Aplicación Flask (Python)</option>
            </select>
            <small>Selecciona el tipo de aplicación que deseas desplegar</small>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>

      <div className="card info-card">
        <h3>Información sobre Templates</h3>
        <ul>
          <li>
            <strong>Sitio Estático:</strong> Para sitios web estáticos con HTML, CSS y JavaScript.
            Debe incluir un Dockerfile que use Nginx.
          </li>
          <li>
            <strong>React:</strong> Para aplicaciones React. El repositorio debe tener un Dockerfile
            que construya y sirva la aplicación.
          </li>
          <li>
            <strong>Flask:</strong> Para aplicaciones web con Flask. Debe incluir requirements.txt
            y un Dockerfile configurado.
          </li>
        </ul>
        <p className="note">
          <strong>Nota:</strong> Tu proyecto será accesible en 
          <code>http://nombreProyecto.tuUsuario.localhost</code>
        </p>
      </div>
    </div>
  );
}

export default ProjectForm;


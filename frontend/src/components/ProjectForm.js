import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import './ProjectForm.css';

const TEMPLATE_URLS = {
  static: 'https://github.com/veronicaospina/static-template',
  react: 'https://github.com/veronicaospina/react-template',
  flask: 'https://github.com/veronicaospina/flask-template'
};

function ProjectForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    githubUrl: '',
    template: ''
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

  const handleTemplateSelect = (template) => {
    setFormData({ ...formData, template });
    window.open(TEMPLATE_URLS[template], '_blank');
    setStep(2);
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

  if (step === 1) {
    return (
      <div className="project-form-container">
        <div className="card">
          <h2>Selecciona un Template</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Elige una plantilla para comenzar tu proyecto. Serás redirigido a GitHub para usarla.
          </p>
          
          <div className="template-options">
            <div className="template-card" onClick={() => handleTemplateSelect('static')}>
              <h3>Sitio Estático</h3>
              <p>HTML, CSS y JavaScript</p>
            </div>
            <div className="template-card" onClick={() => handleTemplateSelect('react')}>
              <h3>React</h3>
              <p>Aplicación React con Dockerfile</p>
            </div>
            <div className="template-card" onClick={() => handleTemplateSelect('flask')}>
              <h3>Flask</h3>
              <p>Aplicación Python Flask</p>
            </div>
          </div>
          
          <div className="form-actions">
             <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-form-container">
      <div className="card">
        <h2>Detalles del Proyecto</h2>
        <p style={{ marginBottom: '20px' }}>
          Template seleccionado: <strong>{formData.template}</strong>
        </p>
        
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
            <small>Ingresa la URL del repositorio que creaste a partir del template</small>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-secondary"
            >
              Atrás
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


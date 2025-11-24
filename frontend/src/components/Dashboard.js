import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1>Plataforma de Hosting</h1>
            <div className="header-actions">
              <span className="username">Bienvenido, {user?.username}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <nav className="dashboard-nav">
        <div className="container">
          <Link to="/" className="nav-link">Mis Proyectos</Link>
          <Link to="/projects/new" className="nav-link">Nuevo Proyecto</Link>
        </div>
      </nav>
      
      <main className="dashboard-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;


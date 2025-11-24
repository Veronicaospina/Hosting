import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { token, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;


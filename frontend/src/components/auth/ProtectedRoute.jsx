import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Se o usuário não estiver autenticado, redireciona para a página de login.
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, mostra a página que ele tentou acessar.
  return children;
}

export default ProtectedRoute;
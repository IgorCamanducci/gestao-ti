import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Se não estiver autenticado, redireciona para /login
    // 'replace' impede o usuário de voltar para a página anterior com o botão de "voltar" do navegador
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se estiver autenticado, renderiza a página solicitada
  return children;
}

export default ProtectedRoute;
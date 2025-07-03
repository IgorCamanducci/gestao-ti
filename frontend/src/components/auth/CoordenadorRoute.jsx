import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function CoordenadorRoute({ children }) {
  const { isAuthenticated, loading, profile } = useAuth();

  // Enquanto o sistema verifica a autenticação, mostramos uma mensagem
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se não estiver logado OU se o perfil não for de um coordenador,
  // redireciona para a página inicial.
  if (!isAuthenticated || profile?.role !== 'coordenador') {
    return <Navigate to="/" replace />;
  }

  // Se passou por todas as verificações, permite o acesso.
  return children;
}

export default CoordenadorRoute;
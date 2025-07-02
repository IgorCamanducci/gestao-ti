import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Criamos uma função async interna para poder usar o 'await'
    const performLogout = async () => {
      try {
        // CORREÇÃO: Espera a conclusão da função de logout
        await logout();
        // Só depois de deslogar, ele navega para a página de login
        navigate('/login', { replace: true });
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        // Mesmo se der erro, força o redirecionamento
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]); // As dependências continuam as mesmas

  return null; // O componente continua não renderizando nada visualmente
}

export default Logout;
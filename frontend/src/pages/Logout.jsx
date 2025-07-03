import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Caminho corrigido

function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        navigate('/login', { replace: true });
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]);

  return null;
}

export default Logout;
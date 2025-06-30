import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Armazena dados do usuário se logado

  // Função para realizar o login
  const login = (userData) => {
    setUser(userData); // Guarda os dados do usuário
    navigate('/folgas'); // Redireciona para uma página principal após o login
  };

  // Função para realizar o logout
  const logout = () => {
    setUser(null); // Limpa os dados do usuário
    navigate('/login'); // Redireciona para a página de login
  };

  const isAuthenticated = !!user; // Converte o 'user' em true/false

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso
export const useAuth = () => useContext(AuthContext);
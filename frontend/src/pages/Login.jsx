import React, { useState, useEffect } from 'react';
import './Login.css';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { theme, toggleTheme } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Se o usuário já estiver logado (ex: recarregou a página), redireciona
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/folgas'); // Redireciona para a página principal
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Chama a função de login do context, que agora fala com o Supabase
    const { error } = await login(email, password);
    if (error) {
      alert('Erro no login: ' + error.message);
    }
    // O redirecionamento será feito automaticamente pelo onAuthStateChange no AuthContext
  };

  return (
    <div className="login-page">
      <button onClick={toggleTheme} className="theme-toggle-button">
        {theme === 'light' ? <FaMoon size={22} /> : <FaSun size={24} color="#f9d71c" />}
      </button>
      <div className="login-container">
        <h1>Gestão de TI</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
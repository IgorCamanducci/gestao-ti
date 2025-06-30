import React, { useState } from 'react';
import './Login.css';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3001';

function Login() {
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Código completo da requisição fetch que estava faltando
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Em vez de alert, chame a função login!
        // Vamos passar um objeto de usuário simples por enquanto
        login({ email: email, name: 'Usuário Teste' });
      } else {
        alert('Erro: ' + data.message);
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert('Não foi possível conectar ao servidor.');
    }
  };

  // O JSX completo que estava faltando
  return (
    <div className="login-page">
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        aria-label={theme === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
      >
        {theme === 'light' ? <FaMoon size={22} /> : <FaSun size={24} color="#f9d71c" />}
      </button>

      <div className="login-container">
        <h1>Gestão de TI</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Endereço de e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
import React, { useState } from 'react';
import './Login.css'; // O CSS que ajustamos para responsividade
import { useTheme } from '../context/ThemeContext'; // Hook para o tema
// CORREÇÃO: Importando ícones do Font Awesome (fa) em vez do Weather Icons (wi)
import { FaMoon, FaSun } from 'react-icons/fa';

function Login() {
  // Hook para gerenciar o tema (claro/escuro)
  const { theme, toggleTheme } = useTheme();

  // Hooks para armazenar os valores dos campos de e-mail e senha
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Função chamada ao clicar no botão "Entrar"
  const handleSubmit = (event) => {
    // Previne que a página recarregue ao enviar o formulário
    event.preventDefault();

    // Por enquanto, apenas exibimos os dados no console do navegador
    console.log('Tentativa de login com:');
    console.log('Email:', email);
    console.log('Senha:', password);
  };

  return (
    <div className="login-page">
      {/* Botão para alternar o tema, posicionado no canto da tela via CSS */}
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        aria-label={theme === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
      >
        {/* CORREÇÃO: Usando os ícones FaMoon e FaSun */}
        {theme === 'light' ? <FaMoon size={22} /> : <FaSun size={24} color="#f9d71c" />}
      </button>

      {/* Container principal do formulário de login */}
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

// Exporta o componente para ser usado em outras partes do aplicativo
export default Login;
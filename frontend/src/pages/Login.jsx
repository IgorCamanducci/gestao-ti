import React, { useState, useEffect } from 'react';
import './Login.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/folgas');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { error } = await login(email, password);
    if (error) {
      alert('Erro no login: ' + error.message);
    }
    // O redirecionamento é feito pelo useEffect acima
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Gestão</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Entrar</button>
        </form>
        <div className="forgot-password-link">
          <Link to="/recuperar-senha">Esqueceu a senha?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
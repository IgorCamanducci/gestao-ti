import React, { useState, useEffect } from 'react';
import './Login.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) {
        throw error;
      }
    } catch (error) {
      toast.error(error.message || "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🏢</div>
          <h1 className="login-title">Sistema de Gestão</h1>
          <p className="login-subtitle">Faça login para continuar</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email"
              placeholder="Digite seu e-mail" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input 
              type="password" 
              id="password"
              placeholder="Digite sua senha" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading} 
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="login-footer">
          <Link to="/recuperar-senha">Esqueceu a senha?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Login.css';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Tenta usar VITE_SITE_URL se definida
      let siteUrl = import.meta.env.VITE_SITE_URL?.trim();
      
      // Se não estiver definida ou for localhost, usa a origem atual
      if (!siteUrl || siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
        siteUrl = window.location.origin;
      }

      // Remove barra final se existir
      siteUrl = siteUrl.replace(/\/$/, '');

      const redirectTo = `${siteUrl}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      toast.success('Link de recuperação enviado! Verifique seu e-mail.');
      setMessage('');
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🔒</div>
          <h1 className="login-title">Recuperar Senha</h1>
          <p className="login-subtitle">Digite seu e-mail para receber um link de recuperação</p>
        </div>

        <form className="login-form" onSubmit={handlePasswordReset}>
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

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        {message && <p style={{ marginTop: '12px' }}>{message}</p>}

        <div className="login-footer">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
export default RecuperarSenha;
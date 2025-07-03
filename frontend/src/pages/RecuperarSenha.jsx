import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './Login.css'; // Reutilizando o estilo do login
import { Link } from 'react-router-dom';

function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password',
      });
      if (error) throw error;
      setMessage('Link de recuperação enviado! Verifique seu e-mail.');
    } catch (error) {
      setMessage('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Recuperar Senha</h1>
        <p style={{ color: 'var(--secondary-text-color)', marginTop: '-1rem', marginBottom: '1.5rem' }}>
          Digite seu e-mail para receber um link de recuperação.
        </p>
        <form className="login-form" onSubmit={handlePasswordReset}>
          <input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Link'}</button>
        </form>
        {message && <p style={{marginTop: '16px'}}>{message}</p>}
        <div className="forgot-password-link">
          <Link to="/login">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}
export default RecuperarSenha;
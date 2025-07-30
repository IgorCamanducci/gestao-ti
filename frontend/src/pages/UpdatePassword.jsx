import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './Login.css'; // Reutilizando o estilo do login
import toast from 'react-hot-toast';

function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Atualizando senha...');
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      toast.success('Senha atualizada com sucesso! Você já pode fazer o login.', { id: toastId });
      navigate('/login');
    } catch (error) {
      toast.error('Erro: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Crie uma Nova Senha</h1>
        <p style={{ color: 'var(--secondary-text-color)', marginTop: '-1rem', marginBottom: '1.5rem' }}>
          Digite sua nova senha abaixo. Ela precisa ter no mínimo 6 caracteres.
        </p>
        <form className="login-form" onSubmit={handlePasswordUpdate}>
          <input type="password" placeholder="Nova Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Atualizando...' : 'Salvar Nova Senha'}</button>
        </form>
      </div>
    </div>
  );
}

export default UpdatePassword;
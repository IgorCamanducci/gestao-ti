import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import { FaUserCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './Configuracoes.css';

function Configuracoes() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Salvando alterações...');
    try {
      const updates = {
        full_name: fullName,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso!', { id: toastId });
      await refreshProfile();
    } catch (error) {
      toast.error('Erro ao atualizar o perfil: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    const toastId = toast.loading('Enviando imagem...');
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para fazer o upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Avatar atualizado!', { id: toastId });
    } catch (error) {
      toast.error('Erro no upload do avatar: ' + error.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Alterando senha...');
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!', { id: toastId });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Erro ao alterar a senha: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Configurações</h1>

      <section className="settings-section">
        <h2>Perfil</h2>
        <div className="avatar-section">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="avatar-preview" />
          ) : (
            <FaUserCircle size={80} className="avatar-placeholder" />
          )}
          <div>
            <label htmlFor="avatar-upload" className="avatar-upload-label">
              {uploading ? 'Enviando...' : 'Trocar foto'}
            </label>
            <input type="file" id="avatar-upload" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
          </div>
        </div>
        
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="text" value={user?.email} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="fullName">Nome Completo</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
          </div>
          <button type="submit" className="form-button" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Dados Pessoais'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2>Alterar Senha</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="newPassword">Nova Senha</label>
            <input id="newPassword" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
            <input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="form-button" disabled={loading}>
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </section>
      
      <section className="settings-section">
        <h2>Aparência</h2>
        <ThemeSwitcher />
      </section>
      
      <section className="settings-section">
        <h2>Gerenciamento do Sistema</h2>
        <Link to="/configuracoes/categorias-ativos" className="form-button">
            Gerenciar Categorias de Ativos
        </Link>
      </section>
    </div>
  );
}

export default Configuracoes;
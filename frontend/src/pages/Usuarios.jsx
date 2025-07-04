import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { FaUserCircle, FaPlus } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Usuarios.css';

// Função para formatar o texto: 'atleta' -> 'Atleta'
const formatRole = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// --- Componente para o Menu de Ações com Portal ---
const ActionsMenu = ({ user, position, onClose, onEdit }) => {
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="actions-menu"
      style={{ top: position.top, left: position.left }}
    >
      <button onClick={() => onEdit(user)}>Editar</button>
      {/* Futuras ações como 'Resetar Senha' ou 'Deletar' virão aqui */}
    </div>,
    document.body
  );
};

// --- Componente do Modal de Edição ---
const EditUserModal = ({ user, onClose, onSave }) => {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [role, setRole] = useState(user.role || 'atleta');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(user.id, { fullName, role });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Editar Usuário</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user.email} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="edit-fullName">Nome Completo</label>
            <input id="edit-fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="edit-role">Perfil</label>
            <select id="edit-role" value={role} onChange={e => setRole(e.target.value)}>
              <option value="atleta">Atleta</option>
              <option value="coordenador">Coordenador</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente do Modal de Criação ---
const AddUserModal = ({ onClose, onSave }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('atleta');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave({ email, password, fullName, role });
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Adicionar Novo Usuário</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="add-fullName">Nome Completo</label>
            <input id="add-fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="add-email">Email</label>
            <input id="add-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="add-password">Senha Provisória (mínimo 6 caracteres)</label>
            <input id="add-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="add-role">Perfil</label>
            <select id="add-role" value={role} onChange={e => setRole(e.target.value)}>
              <option value="atleta">Atleta</option>
              <option value="coordenador">Coordenador</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Componente Principal da Página ---
function Usuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuState, setMenuState] = useState({ user: null, position: null });
  const [editingUser, setEditingUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error.message);
      setError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (userId, { fullName, role }) => {
    const toastId = toast.loading('Atualizando usuário...');
    try {
      const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId);
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.rpc('update_user_role', { user_id: userId, new_role: role });
      if (roleError) throw roleError;
      
      toast.success('Usuário atualizado com sucesso!', { id: toastId });
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar usuário: ' + error.message, { id: toastId });
    }
  };

  const handleCreateUser = async ({ email, password, fullName, role }) => {
    const toastId = toast.loading('Criando novo usuário...');
    try {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName, role: role } },
      });
      if (error) throw error;
      
      toast.success('Usuário criado com sucesso!', { id: toastId });
      fetchUsers();
      return true; // Indica sucesso para fechar o modal
    } catch (error) {
      toast.error('Erro ao criar usuário: ' + error.message, { id: toastId });
      return false; // Indica falha para manter o modal aberto
    }
  };
  
  const handleMenuClick = (user, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuState({
      user,
      position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 160 },
    });
  };

  if (loading) return <div>Carregando usuários...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="user-list-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Gestão de Usuários</h1>
        <button className="form-button" onClick={() => setIsAddModalOpen(true)}>
          <FaPlus style={{ marginRight: '8px' }} />
          Novo Usuário
        </button>
      </div>
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Perfil</th>
              <th style={{textAlign: 'right'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="user-avatar" />
                    ) : (
                      <FaUserCircle className="user-avatar-placeholder" />
                    )}
                    <div className="user-name-email">
                      <span className="name">{user.full_name || 'Usuário sem nome'}</span>
                      <span className="email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>{formatRole(user.role)}</td>
                <td className="actions-cell">
                  <button className="actions-button" onClick={(e) => handleMenuClick(user, e)}>
                    <HiDotsVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {menuState.user && (
        <ActionsMenu
          user={menuState.user}
          position={menuState.position}
          onClose={() => setMenuState({ user: null, position: null })}
          onEdit={(userToEdit) => {
            setEditingUser(userToEdit);
            setMenuState({ user: null, position: null });
          }}
        />
      )}

      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}
      
      {isAddModalOpen && (
        <AddUserModal 
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateUser}
        />
      )}
    </div>
  );
}

export default Usuarios;
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaUserCircle } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import './Usuarios.css';

const formatRole = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

function Usuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    fetchUsers();
  }, []);

  if (loading) return <div>Carregando usuários...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="user-list-page">
      <h1>Gestão de Usuários</h1>
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Perfil</th>
              <th>Ações</th>
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
                <td>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <HiDotsVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Usuarios;
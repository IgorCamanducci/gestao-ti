import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast'; // Importação para as notificações

// Importação de todos os ícones
import { 
  FaUserCircle, 
  FaBars, 
  FaHome, 
  FaCalendarAlt, 
  FaBoxOpen, 
  FaUsers, 
  FaCogs, 
  FaSignOutAlt, 
  FaTasks, 
  FaExchangeAlt, 
  FaWarehouse, 
  FaDesktop 
} from 'react-icons/fa';

import './layout.css';

// Função que lê o estado inicial do menu no localStorage
const getInitialMenuState = () => {
  const savedState = localStorage.getItem('isMenuCollapsed');
  return savedState === 'true';
};

function Layout() {
  const { profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(getInitialMenuState);

  useEffect(() => {
    localStorage.setItem('isMenuCollapsed', isCollapsed);
  }, [isCollapsed]);

  // Lista de itens do menu principal, com a lógica para o perfil de Coordenador
  const menuItems = [
    { path: '/', name: 'Página Inicial', icon: <FaHome /> },
    { path: '/folgas', name: 'Gestão de Folgas', icon: <FaCalendarAlt /> },
    { path: '/ferias', name: 'Gestão de Férias', icon: <FaCalendarAlt /> },
    { path: '/inventario', name: 'Inventário', icon: <FaBoxOpen /> },
    { path: '/ativos', name: 'Controle de Ativos', icon: <FaDesktop /> },
    { path: '/estoque', name: 'Controle de Estoque', icon: <FaWarehouse /> },
    { path: '/turno', name: 'Troca de Turno', icon: <FaExchangeAlt /> },
    { path: '/pendencias', name: 'Pendências', icon: <FaTasks /> },
    profile?.role === 'coordenador' && { path: '/usuarios', name: 'Usuários', icon: <FaUsers /> },
  ].filter(Boolean);

  return (
    <div className={`app-layout ${isCollapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar">
        <div>
          <div className="sidebar-header">
            <h2 className="logo-text">{!isCollapsed ? 'Gestão' : 'G'}</h2>
            <button className="toggle-button" onClick={() => setIsCollapsed(!isCollapsed)}>
              <FaBars />
            </button>
          </div>

          <div className="profile-section">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="profile-avatar" />
            ) : (
              <FaUserCircle size={40} className="profile-avatar-placeholder" />
            )}
            <span className="profile-name">{profile?.full_name || 'Usuário'}</span>
          </div>
          
          <ul className="main-nav">
            <li className="separator-nav"></li>
            {menuItems.map(item => (
              <li key={item.name}>
                <NavLink to={item.path} end={item.path === '/'}>
                  {item.icon}
                  <span className="link-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <ul className="bottom-nav">
          <li className="separator-nav"></li>
          <li>
            <NavLink to="/configuracoes">
              <FaCogs />
              <span className="link-text">Configurações</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/logout">
              <FaSignOutAlt />
              <span className="link-text">Logout</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="content">
        {/* Componente que vai renderizar as notificações na tela */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-secondary-color)',
              color: 'var(--primary-text-color)',
              border: '1px solid var(--border-color)',
            },
            success: {
              iconTheme: {
                primary: '#16a34a',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: 'white',
              },
            },
          }}
        />
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
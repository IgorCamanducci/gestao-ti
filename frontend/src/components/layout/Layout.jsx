import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
  FaDesktop,
  FaHistory // <-- 1. Importa o ícone de Histórico
} from 'react-icons/fa';

import './layout.css';

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
    { path: '/historico', name: 'Histórico', icon: <FaHistory /> }, // <-- 2. Adiciona o novo item de menu
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
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
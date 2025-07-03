import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUserCircle, FaBars, FaHome, FaCalendarAlt, FaBoxOpen, FaUsers, FaCogs, FaSignOutAlt, FaTasks, FaExchangeAlt, FaWarehouse, FaDesktop } from 'react-icons/fa';
import './layout.css';

function Layout() {
  const { profile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: '/', name: 'Página Inicial', icon: <FaHome /> },
    { path: '/folgas', name: 'Gestão de Folgas', icon: <FaCalendarAlt /> },
    { path: '/ferias', name: 'Gestão de Férias', icon: <FaCalendarAlt /> },
    { path: '/inventario', name: 'Inventário', icon: <FaBoxOpen /> },
    { path: '/ativos', name: 'Controle de Ativos', icon: <FaDesktop /> },
    { path: '/estoque', name: 'Controle de Estoque', icon: <FaWarehouse /> },
    { path: '/turno', name: 'Troca de Turno', icon: <FaExchangeAlt /> },
    { path: '/pendencias', name: 'Pendências', icon: <FaTasks /> },
    { path: '/usuarios', name: 'Usuários', icon: <FaUsers /> },
  ];

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
                <NavLink to={item.path} end>
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
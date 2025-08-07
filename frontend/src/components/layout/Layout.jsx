import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaUserCircle, FaBars, FaHome, FaCalendarAlt, FaBoxOpen, FaUsers,
  FaCogs, FaSignOutAlt, FaTasks, FaExchangeAlt, FaWarehouse, FaDesktop,
  FaHistory, FaSun, FaMoon
} from 'react-icons/fa';
import './layout.css';

const getInitialMenuState = () => {
  const savedState = localStorage.getItem('isMenuCollapsed');
  return savedState === 'true';
};

const getInitialSidebarWidth = () => {
  const savedWidth = localStorage.getItem('sidebarWidth');
  return savedWidth ? parseInt(savedWidth) : 240;
};

function Layout() {
  const { profile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(getInitialMenuState);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(getInitialSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('isMenuCollapsed', isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Ordem e agrupamento conforme solicitado
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
    { path: '/historico', name: 'Histórico', icon: <FaHistory /> },
  ].filter(Boolean);

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleMouseDown = (e) => {
    if (isCollapsed) return;
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    const minWidth = 200;
    const maxWidth = 400;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <div className={`layout-container ${isCollapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''}`}>
      {/* Overlay para mobile */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={handleSidebarClose}
      />

      {/* Sidebar */}
      <nav 
        ref={sidebarRef}
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        style={{ width: isCollapsed ? '70px' : `${sidebarWidth}px` }}
      >
        <div className="logo-group">
          <button
            className="toggle-button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
          >
            <FaBars />
          </button>
          <span className="logo-text">{!isCollapsed ? 'Gestão TI' : 'G'}</span>
        </div>

        <div className="nav-menu refined">
          {menuItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleSidebarClose}
              title={isCollapsed ? item.name : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-footer refined">
          <div className="sidebar-actions refined">
            <button
              className="sidebar-action-btn"
              onClick={toggleTheme}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {isDark ? <FaSun /> : <FaMoon />}
            </button>
            <NavLink to="/configuracoes" className="sidebar-action-btn" title="Configurações">
              <FaCogs />
            </NavLink>
            <NavLink to="/logout" className="sidebar-action-btn logout" title="Sair">
              <FaSignOutAlt />
            </NavLink>
          </div>
          <div className="user-avatar refined">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(profile?.full_name)
            )}
          </div>
        </div>

        {/* Handle de redimensionamento */}
        {!isCollapsed && (
          <div 
            className="resize-handle"
            onMouseDown={handleMouseDown}
          />
        )}
      </nav>

      {/* Conteúdo principal */}
      <main className="main-content refined">
        <div className="page-content refined">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
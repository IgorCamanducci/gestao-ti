import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaUserCircle, FaBars, FaHome, FaCalendarAlt, FaBoxOpen, FaUsers,
  FaCogs, FaSignOutAlt, FaTasks, FaExchangeAlt, FaWarehouse, FaDesktop,
  FaHistory, FaSun, FaMoon, FaWrench, FaKey, FaStickyNote, FaFileSignature
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
    { path: '/pendencias', name: 'Pendências', icon: <FaTasks /> },
    { path: '/turno', name: 'Troca de Turno', icon: <FaExchangeAlt /> },
    { path: '/inventario', name: 'Inventário', icon: <FaBoxOpen /> },
    { path: '/estoque', name: 'Estoque', icon: <FaWarehouse /> },
    { path: '/ativos', name: 'Ativos', icon: <FaDesktop /> },
    { path: '/manutencao', name: 'Manutenção', icon: <FaWrench /> },
    { path: '/historico', name: 'Histórico', icon: <FaHistory /> },
    { path: '/termos', name: 'Termos de Uso', icon: <FaFileSignature /> },
    { path: '/folgas', name: 'Gestão de Folgas', icon: <FaCalendarAlt /> },
    { path: '/anotacoes', name: 'Anotações', icon: <FaStickyNote /> },
    { path: '/senhas', name: 'Senhas', icon: <FaKey /> },
    profile?.role === 'coordenador' && { path: '/usuarios', name: 'Usuários', icon: <FaUsers /> },
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
              <span className="nav-text">Tema</span>
            </button>
            <NavLink to="/configuracoes" className="sidebar-action-btn" title="Configurações">
              <FaCogs />
              <span className="nav-text">Configurações</span>
            </NavLink>
            <NavLink to="/logout" className="sidebar-action-btn logout" title="Sair">
              <FaSignOutAlt />
              <span className="nav-text">Sair</span>
            </NavLink>
          </div>
          <div className="user-avatar refined">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
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
        {/* Topbar para dispositivos móveis */}
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setIsSidebarOpen(true)}
            title="Abrir menu"
          >
            <FaBars />
          </button>
          <span className="topbar-title">Gestão TI</span>
        </header>
        <div className="page-content refined">
          <Outlet />
        </div>
        
        {/* Rodapé com direitos autorais */}
        <footer className="footer">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} Desenvolvido por Igor Camanducci. Todos os direitos reservados.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Layout;
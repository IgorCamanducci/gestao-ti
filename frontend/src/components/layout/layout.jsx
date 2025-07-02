import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import './layout.css'; // Vamos criar este arquivo de estilo a seguir

function Layout() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <h2>Gestão TI</h2>
        <ul>
          <li><Link to="/folgas">Gestão de Folgas</Link></li>
          <li><Link to="/ferias">Gestão de Férias</Link></li>
          <li><Link to="/inventario">Inventário</Link></li>
          <li><Link to="/ativos">Controle de Ativos</Link></li>
          <li><Link to="/estoque">Controle de Estoque</Link></li>
          <li><Link to="/turno">Troca de Turno</Link></li>
          <li><Link to="/pendencias">Pendências</Link></li>
          <li><Link to="/usuarios">Usuários</Link></li> {/* <-- ADICIONE ESTA LINHA */}
          <li className="separator"><Link to="/configuracoes">Configurações</Link></li>
          <li><Link to="/logout">Logout</Link></li>
        </ul>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
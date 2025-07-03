import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Componentes
import Layout from './components/layout/layout.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import RecuperarSenha from './pages/RecuperarSenha.jsx';

// Páginas
import PaginaInicial from './pages/PaginaInicial.jsx';
import GestaoDeFolgas from './pages/GestaoDeFolgas.jsx';
import GestaoDeFerias from './pages/GestaoDeFerias.jsx';
import Inventario from './pages/Inventario.jsx';
import ControleDeAtivos from './pages/ControleDeAtivos.jsx';
import ControleDeEstoque from './pages/ControleDeEstoque.jsx';
import TrocaDeTurno from './pages/TrocaDeTurno.jsx';
import Pendencias from './pages/Pendencias.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import Logout from './pages/Logout.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PaginaInicial /> },
      { path: 'folgas', element: <GestaoDeFolgas /> },
      { path: 'ferias', element: <GestaoDeFerias /> },
      { path: 'inventario', element: <Inventario /> },
      { path: 'ativos', element: <ControleDeAtivos /> },
      { path: 'estoque', element: <ControleDeEstoque /> },
      { path: 'turno', element: <TrocaDeTurno /> },
      { path: 'pendencias', element: <Pendencias /> },
      { path: 'usuarios', element: <Usuarios /> },
      { path: 'configuracoes', element: <Configuracoes /> },
      { path: 'logout', element: <Logout /> },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/recuperar-senha', element: <RecuperarSenha /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
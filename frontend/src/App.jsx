import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Componentes
import Layout from './components/layout/Layout.jsx'; // Caminho corrigido para 'layout' minúsculo
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import CoordenadorRoute from './components/auth/CoordenadorRoute.jsx';
import RecuperarSenha from './pages/RecuperarSenha.jsx';
import UpdatePassword from './pages/UpdatePassword.jsx';

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
    element: (<ProtectedRoute><Layout /></ProtectedRoute>),
    children: [
      { index: true, element: <PaginaInicial /> },
      { path: 'folgas', element: <GestaoDeFolgas /> },
      { path: 'ferias', element: <GestaoDeFerias /> },
      { path: 'inventario', element: <Inventario /> },
      { path: 'ativos', element: <ControleDeAtivos /> },
      { path: 'estoque', element: <ControleDeEstoque /> },
      { path: 'turno', element: <TrocaDeTurno /> },
      { path: 'pendencias', element: <Pendencias /> },
      { path: 'usuarios', element: (<CoordenadorRoute><Usuarios /></CoordenadorRoute>) },
      { path: 'configuracoes', element: <Configuracoes /> },
      { path: 'logout', element: <Logout /> },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/recuperar-senha', element: <RecuperarSenha /> },
  { path: '/update-password', element: <UpdatePassword /> },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-secondary-color)',
            color: 'var(--primary-text-color)',
            border: '1px solid var(--border-color)',
          },
          success: { iconTheme: { primary: '#16a34a', secondary: 'white' } },
          error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
        }}
      />
    </>
  );
}

export default App;
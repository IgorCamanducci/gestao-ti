import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Componentes de estrutura e autenticação
// CORREÇÃO: O caminho começa com './' pois as pastas são vizinhas dentro de 'src'
import Layout from './components/layout/layout.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

// Importação de todas as páginas da sua aplicação
// CORREÇÃO: O caminho começa com './' para todas as páginas
import GestaoDeFolgas from './pages/GestaoDeFolgas.jsx';
import GestaoDeFerias from './pages/GestaoDeFerias.jsx';
import Inventario from './pages/Inventario.jsx';
import ControleDeAtivos from './pages/ControleDeAtivos.jsx';
import ControleDeEstoque from './pages/ControleDeEstoque.jsx';
import TrocaDeTurno from './pages/TrocaDeTurno.jsx';
import Pendencias from './pages/Pendencias.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import Logout from './pages/Logout.jsx';

// Definição de todas as rotas
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'folgas', element: <GestaoDeFolgas /> },
      { path: 'ferias', element: <GestaoDeFerias /> },
      { path: 'inventario', element: <Inventario /> },
      { path: 'ativos', element: <ControleDeAtivos /> },
      { path: 'estoque', element: <ControleDeEstoque /> },
      { path: 'turno', element: <TrocaDeTurno /> },
      { path: 'pendencias', element: <Pendencias /> },
      { path: 'configuracoes', element: <Configuracoes /> },
      { path: 'logout', element: <Logout /> },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);

// Componente principal que provê as rotas para a aplicação
function App() {
  return <RouterProvider router={router} />;
}

export default App;
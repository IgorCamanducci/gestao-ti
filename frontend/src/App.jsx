import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Importando nosso Layout
import Layout from './components/layout/Layout.jsx';

// Importando todas as nossas páginas
import Login from './pages/Login.jsx';
import GestaoDeFolgas from './pages/GestaoDeFolgas.jsx';
import GestaoDeFerias from './pages/GestaoDeFerias.jsx';
import Inventario from './pages/Inventario.jsx';
import ControleDeAtivos from './pages/ControleDeAtivos.jsx';
import ControleDeEstoque from './pages/ControleDeEstoque.jsx';
import TrocaDeTurno from './pages/TrocaDeTurno.jsx';
import Pendencias from './pages/Pendencias.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import Logout from './pages/Logout.jsx';

// Definindo as rotas do nosso site
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />, // O Layout é o elemento principal
    children: [
      // As páginas abaixo serão renderizadas DENTRO do Layout
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
    // A página de Login NÃO terá o menu lateral
    path: '/login',
    element: <Login />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
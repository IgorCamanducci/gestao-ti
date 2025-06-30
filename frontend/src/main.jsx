import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Importando os nossos Provedores de Contexto
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // ESTA LINHA ESTAVA FALTANDO

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider> {/* O AuthProvider precisa ser importado para ser usado aqui */}
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
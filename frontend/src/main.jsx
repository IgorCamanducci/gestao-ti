import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx'; // PRECISA TER ESSA LINHA

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider> {/* 2. Envolva o App aqui */}
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
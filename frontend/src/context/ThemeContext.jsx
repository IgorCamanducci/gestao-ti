import React, { createContext, useState, useEffect, useContext } from 'react';

// Cria o contexto
const ThemeContext = createContext();

// Cria o componente Provedor
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light'); // 'light' é o padrão

  // Esta função será chamada para trocar o tema
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Este 'useEffect' observa mudanças na variável 'theme'
  // e adiciona ou remove a classe 'dark' do corpo do HTML
  useEffect(() => {
    document.body.className = ''; // Limpa classes anteriores
    document.body.classList.add(theme); // Adiciona a classe 'light' ou 'dark'
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook customizado para facilitar o uso do contexto
export const useTheme = () => useContext(ThemeContext);
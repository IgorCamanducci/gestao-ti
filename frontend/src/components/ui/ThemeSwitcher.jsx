import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaMoon, FaSun } from 'react-icons/fa';
import './ThemeSwitcher.css';

function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="theme-switcher-button">
      {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
      <span style={{ marginLeft: '8px' }}>
        Mudar para Tema {theme === 'light' ? 'Escuro' : 'Claro'}
      </span>
    </button>
  );
}
export default ThemeSwitcher;
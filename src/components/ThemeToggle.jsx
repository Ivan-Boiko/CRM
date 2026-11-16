import React, { useEffect, useState } from 'react';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  // Тема применяется через атрибут data-theme на body
  useEffect(() => {
    if (isDarkMode) {
      localStorage.setItem('theme', 'dark');
      document.body.dataset.theme = 'dark';
    } else {
      localStorage.setItem('theme', 'light');
      document.body.dataset.theme = '';
    }
  }, [isDarkMode]);

  return (
    <div
      className={`theme-toggle ${isDarkMode ? 'dark-contaner' : ''}`}
      onClick={() => setIsDarkMode(!isDarkMode)}
    >
      <div className={`toggle-circle ${isDarkMode ? 'dark' : ''}`}>
        {isDarkMode ? '🌙' : '☀️'}
      </div>
    </div>
  );
};

export default ThemeToggle;

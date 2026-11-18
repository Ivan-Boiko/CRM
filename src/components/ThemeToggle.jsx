import React, { useEffect, useState } from 'react';
import './ThemeToggle.css';
import { useLanguage } from '../context/LanguageContext';

const ThemeToggle = ({ compact = false }) => {
  const { t } = useLanguage();
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

  // Компактная кнопка для шапки и страницы входа: одна иконка вместо плашки
  if (compact) {
    const label = isDarkMode ? t('theme.toLight') : t('theme.toDark');
    return (
      <button
        type="button"
        className={`theme-toggle theme-toggle--icon ${isDarkMode ? 'dark-contaner' : ''}`}
        onClick={() => setIsDarkMode(!isDarkMode)}
        aria-label={label}
        title={label}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    );
  }

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

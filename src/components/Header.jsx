// Header.jsx
import React from 'react';
import './Header.css';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="header">
      <div className="header__theme-switcher">
        <ThemeToggle />
      </div>
      <h1 className="header_title">
        <button className="header_button button_glob" onClick={() => navigate('/')}>
          {t('app.title')}
        </button>
      </h1>
      <div className="header__language">
        <LanguageToggle />
      </div>
    </div>
  );
}

export default Header;

// Header.jsx
import React from 'react';
import './Header.css';
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle"
import { useNavigate } from 'react-router-dom';

function Header(setLanguage) {
        const navigate = useNavigate();
    
        const onRegister = () => {
          navigate("/"); // Переход на страницу регистрации
        }
    return (
        <div className="header">
            <div className="header__theme-switcher">
                <ThemeToggle />
            </div>
            <h1 className="header_title">
                <button className="header_button button_glob" onClick={onRegister}>
                    Главная
                </button>
            </h1>
            <div className="header__language">
                <LanguageToggle />
            </div>
        </div>
    );
}

export default Header;
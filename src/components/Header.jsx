// Header.jsx
import React from 'react';
import './Header.css';
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle"
import { useNavigate } from 'react-router-dom';

// Fix the props destructuring
function Header({ toggleTheme, setLanguage }) {
    const navigate = useNavigate();
    
    const onRegister = () => {
        navigate("/"); // Переход на страницу регистрации
    }
    
    return (
        <div className="header">
            <div className="header__theme-switcher">
                <ThemeToggle onChange={toggleTheme} />
            </div>
            <h1 className="header_title">
                <button className="header_button button_glob" onClick={onRegister}>
                    Главная
                </button>
            </h1>
            <div className="header__language">
                <LanguageToggle onLanguageChange={setLanguage} />
            </div>
        </div>
    );
}

export default Header;
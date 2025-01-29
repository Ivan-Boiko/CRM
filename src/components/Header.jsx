// Header.jsx
import React from 'react';
import '../styles/Header.css';
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
            <ThemeToggle />
            <h1 className="header_title"><button className="header_button button_glob" onClick={onRegister}>Главная</button></h1>
            <LanguageToggle />
            </div>
    );
}

export default Header;
// Header.jsx
import React from 'react';
import '../styles/Header.css';
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle"

function Header(setLanguage) {
    return (
        <div className="header">
            <ThemeToggle />
            <LanguageToggle />
            </div>
    );
}

export default Header;
// MainPage.jsx
import React from 'react';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import './MainPage.css';

function MainPage() {
    const toggleTheme = () => {
        document.body.classList.toggle('dark-theme');
    };

    const setLanguage = (lang) => {
        console.log(`Language switched to: ${lang}`);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        console.log('Login submitted');
    };

    const handleRegister = () => {
        console.log('Redirect to registration page');
    };

    return (
        <div className="container">
        <div className="main-page">
            <Header toggleTheme={toggleTheme} setLanguage={setLanguage} />
            <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
        </div>
        </div>
    );
}

export default MainPage;
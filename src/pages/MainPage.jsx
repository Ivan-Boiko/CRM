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
        <div className="page-container">
            <Header toggleTheme={toggleTheme} setLanguage={setLanguage} />
            <div className="main-layout">
                <div className="main-content">
                    <div className="content-wrapper">
                        <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainPage;
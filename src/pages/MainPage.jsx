// MainPage.jsx
import React, { useState, useCallback } from 'react';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import RegistrationModal from '../components/RegistrationModal';
import './MainPage.css';

function MainPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleOpenModal = useCallback(() => {
        if (!isModalOpen) {
            setIsModalOpen(true);
        }
    }, [isModalOpen]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const handleRegistrationSubmit = useCallback((formData) => {
        console.log('Registration submitted:', formData);
        // Here you would typically send the data to your backend
    }, []);

    return (
        <div className="page-container">
            <Header toggleTheme={toggleTheme} setLanguage={setLanguage} />
            <div className="main-layout">
                <div className="main-content">
                    <div className="content-wrapper">
                        <LoginForm onLogin={handleLogin} onRegister={handleOpenModal} />
                        <RegistrationModal 
                            isOpen={isModalOpen} 
                            onClose={handleCloseModal} 
                            onSubmit={handleRegistrationSubmit} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainPage;
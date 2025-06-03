// MainPage.jsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import RegistrationModal from '../components/RegistrationModal';
import './MainPage.css';

function MainPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const toggleTheme = () => {
        document.body.classList.toggle('dark-theme');
    };

    const setLanguage = (lang) => {
        console.log(`Language switched to: ${lang}`);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (response.ok) {
                navigate('/main');
            } else {
                console.log('Login failed');
            }
        } catch (err) {
            console.error('Login error', err);
        }
    };

    const handleOpenModal = useCallback(() => {
        if (!isModalOpen) {
            setIsModalOpen(true);
        }
    }, [isModalOpen]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    const handleRegistrationSubmit = useCallback(async (formData) => {
        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                console.log('Registration successful');
            } else {
                console.log('Registration failed');
            }
        } catch (err) {
            console.error('Registration error', err);
        }
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
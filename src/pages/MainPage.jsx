// MainPage.jsx
import React, { useCallback, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import RegistrationModal from '../components/RegistrationModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import './MainPage.css';

function MainPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const { notify } = useToast();
  const { t } = useLanguage();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      notify(t('toast.loginSuccess'), 'success');
      navigate('/main');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleRegistrationSubmit = useCallback(
    async (formData) => {
      try {
        await register(formData.name, formData.email, formData.password);
        notify(t('toast.registerSuccess'), 'success');
        navigate('/main');
      } catch (err) {
        notify(err.message, 'error');
      }
    },
    [register, notify, t, navigate]
  );

  // Уже авторизованного сразу отправляем в личный кабинет
  if (user) {
    return <Navigate to="/main" replace />;
  }

  return (
    <div className="page-container">
      <Header />
      <div className="main-layout">
        <div className="main-content">
          <div className="content-wrapper">
            <LoginForm onLogin={handleLogin} onRegister={() => setIsModalOpen(true)} />
            <RegistrationModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleRegistrationSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;

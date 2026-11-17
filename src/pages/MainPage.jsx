// MainPage.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegistrationModal from '../components/RegistrationModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../api';
import './MainPage.css';

function MainPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Регистрацию можно закрыть на сервере (ALLOW_REGISTRATION=false)
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const { notify } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    apiFetch('/config')
      .then((config) => {
        if (!cancelled) setRegistrationEnabled(Boolean(config && config.registrationEnabled));
      })
      // Сервер недоступен — просто не показываем регистрацию
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
      <div className="main-layout">
        <div className="main-content">
          <div className="content-wrapper">
            <LoginForm
              onLogin={handleLogin}
              onRegister={() => setIsModalOpen(true)}
              showRegister={registrationEnabled}
            />
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

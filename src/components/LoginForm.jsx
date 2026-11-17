// LoginForm.jsx
import React, { useState } from 'react';
import './LoginForm.css';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

// showRegister выключается, когда регистрация закрыта на сервере
function LoginForm({ onLogin, onRegister, showRegister = true }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    onRegister();
  };

  return (
    <div className="login">
      <h2 className="login__title">CRM</h2>
      <form className="login__form" onSubmit={handleSubmit}>
        <input
          className="login__input"
          type="email"
          name="email"
          placeholder={t('login.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="login__input"
          type="password"
          name="password"
          placeholder={t('login.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="login__button" type="submit">
          {t('login.submit')}
        </button>
      </form>
      {showRegister ? (
        <button className="login__register-button" onClick={handleRegisterClick}>
          {t('login.register')}
        </button>
      ) : null}
      {/* Тема и язык живут в карточке: шапка на странице входа больше не показывается */}
      <div className="login__controls">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </div>
  );
}

export default LoginForm;

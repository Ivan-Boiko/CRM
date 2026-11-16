// LoginForm.jsx
import React, { useState } from 'react';
import './LoginForm.css';
import { useLanguage } from '../context/LanguageContext';

function LoginForm({ onLogin, onRegister }) {
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
      <button className="login__register-button" onClick={handleRegisterClick}>
        {t('login.register')}
      </button>
    </div>
  );
}

export default LoginForm;

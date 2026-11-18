// LoginForm.jsx
import React, { useState } from 'react';
import './LoginForm.css';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api';

// showRegister выключается, когда регистрация закрыта на сервере
// appearance — переключатели темы и языка, которые стоят в строке заголовка
function LoginForm({ onLogin, onRegister, showRegister = true, appearance = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // «Забыли пароль?» — вторая форма в той же карточке
  const [mode, setMode] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { t } = useLanguage();
  const { notify } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    onRegister();
  };

  const openForgot = () => {
    // Подставляем уже введённый email, чтобы не набирать заново
    setForgotEmail(email);
    setForgotSent(false);
    setMode('forgot');
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotBusy(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email: forgotEmail },
      });
      setForgotSent(true);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setForgotBusy(false);
    }
  };

  // Заголовок карточки: переключатели темы и языка на том же уровне, что и текст
  const renderHeader = (title) => (
    <div className="login__header">
      <h2 className="login__title">{title}</h2>
      {appearance ? <div className="login__header-appearance">{appearance}</div> : null}
    </div>
  );

  if (mode === 'forgot') {
    return (
      <div className="login">
        {renderHeader(t('login.forgotTitle'))}
        {forgotSent ? (
          <p className="login__hint login__hint--success">{t('login.forgotSent')}</p>
        ) : (
          <>
            <p className="login__hint">{t('login.forgotHint')}</p>
            <form className="login__form" onSubmit={handleForgot}>
              <input
                className="login__input"
                type="email"
                name="email"
                placeholder={t('login.email')}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <button className="login__button" type="submit" disabled={forgotBusy}>
                {forgotBusy ? '...' : t('login.forgotSubmit')}
              </button>
            </form>
          </>
        )}
        <button className="login__register-button" onClick={() => setMode('login')}>
          {t('login.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="login">
      {renderHeader('CRM')}
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
      <button className="login__forgot" type="button" onClick={openForgot}>
        {t('login.forgot')}
      </button>
      {showRegister ? (
        <button className="login__register-button" onClick={handleRegisterClick}>
          {t('login.register')}
        </button>
      ) : null}
    </div>
  );
}

export default LoginForm;

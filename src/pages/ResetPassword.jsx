import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import './MainPage.css';
import '../components/LoginForm.css';

// Страница по ссылке из письма: /reset?token=...
const ResetPassword = () => {
  const [params] = useSearchParams();
  const { t } = useLanguage();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t('reset.tooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('reset.mismatch'));
      return;
    }
    setError('');
    setBusy(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-container">
      <div className="main-layout">
        <div className="main-content">
          <div className="content-wrapper">
            <div className="login">
              <h2 className="login__title">{t('reset.title')}</h2>
              {!token ? (
                <p className="login__hint login__hint--error">{t('reset.noToken')}</p>
              ) : done ? (
                <p className="login__hint login__hint--success">{t('reset.done')}</p>
              ) : (
                <form className="login__form" onSubmit={handleSubmit}>
                  <p className="login__hint">{t('reset.hint')}</p>
                  <input
                    className="login__input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('reset.newPassword')}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <input
                    className="login__input"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder={t('reset.confirmPassword')}
                    autoComplete="new-password"
                    required
                  />
                  {error ? <p className="login__error">{error}</p> : null}
                  <button className="login__button" type="submit" disabled={busy}>
                    {busy ? '...' : t('reset.submit')}
                  </button>
                </form>
              )}
              <Link className="login__register-button" to="/">
                {t('reset.backToLogin')}
              </Link>
              <div className="login__controls">
                <ThemeToggle />
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

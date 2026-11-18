import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import './MainPage.css';
import '../components/LoginForm.css';

// Ссылка из письма: /confirm-email?token=...
// Пароль подтверждает, что ссылку открыл владелец аккаунта.
const ConfirmEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Проверяем ссылку до ввода пароля, чтобы показать новый адрес
  useEffect(() => {
    if (!token) {
      setChecking(false);
      return undefined;
    }
    let cancelled = false;
    apiFetch(`/auth/email-change?token=${encodeURIComponent(token)}`)
      .then((data) => {
        if (!cancelled) setEmail(data.email || '');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError(t('confirmEmail.passwordRequired'));
      return;
    }
    setError('');
    setBusy(true);
    try {
      const data = await apiFetch('/auth/confirm-email', {
        method: 'POST',
        body: { token, password },
      });
      setDone(true);
      if (data?.email) setEmail(data.email);
      // В открытой сессии обновляем профиль, чтобы настройки сразу показали новый адрес
      if (user) {
        try {
          await refreshUser();
        } catch (err) {
          // Сессия могла истечь — не мешаем подтверждению
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const invalid = !token || Boolean(error && !email && !checking && !done);

  return (
    <div className="page-container">
      <div className="main-layout">
        <div className="main-content">
          <div className="content-wrapper">
            <div className="login">
              <h2 className="login__title">{t('confirmEmail.title')}</h2>

              {checking ? (
                <p className="login__hint">...</p>
              ) : done ? (
                <p className="login__hint login__hint--success">
                  {t('confirmEmail.done', { email })}
                </p>
              ) : invalid ? (
                <p className="login__hint login__hint--error">
                  {error || t('confirmEmail.invalid')}
                </p>
              ) : (
                <form className="login__form" onSubmit={handleSubmit}>
                  <p className="login__hint">{t('confirmEmail.hint', { email })}</p>
                  <input
                    className="login__input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('confirmEmail.password')}
                    autoComplete="current-password"
                    required
                  />
                  {error ? <p className="login__error">{error}</p> : null}
                  <button className="login__button" type="submit" disabled={busy}>
                    {busy ? '...' : t('confirmEmail.submit')}
                  </button>
                </form>
              )}

              <Link className="login__register-button" to="/main/settings">
                {t('confirmEmail.back')}
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

export default ConfirmEmail;

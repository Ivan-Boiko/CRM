import React, { useEffect, useRef, useState } from 'react';
import IconSettings from './IconSettings';
import './Settings.css';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api';

const AVATAR_SIZE = 128;

const resizeImage = (file, size) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Settings = () => {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const { notify } = useToast();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  // Необязательная привязка Telegram: статус с сервера и выданный код
  const [telegram, setTelegram] = useState(null);
  const [telegramLink, setTelegramLink] = useState(null);
  const [telegramBusy, setTelegramBusy] = useState(false);
  // Аккаунт: смена email и пароля
  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  // Email меняется по ссылке из письма: показываем, какой адрес ждёт подтверждения
  const [pendingEmail, setPendingEmail] = useState('');
  // Настроена ли отправка писем на сервере (RESEND_API_KEY + APP_ORIGIN)
  const [mailEnabled, setMailEnabled] = useState(true);
  // Конкретная причина, почему письма не отправляются
  const [mailIssue, setMailIssue] = useState('');

  const currentAvatar = preview ?? user?.avatar ?? null;
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  // Поле email заполняется текущим адресом пользователя
  useEffect(() => {
    setEmailDraft(user?.email || '');
  }, [user?.email]);

  // Без настроенной почты смена email и сброс пароля не отправятся — предупреждаем
  useEffect(() => {
    let cancelled = false;
    apiFetch('/config')
      .then((config) => {
        if (cancelled) return;
        setMailEnabled(Boolean(config && config.mailEnabled));
        setMailIssue((config && config.mailError) || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Выберите файл изображения', 'error');
      return;
    }
    try {
      const dataUrl = await resizeImage(file, AVATAR_SIZE);
      setPreview(dataUrl);
    } catch (err) {
      notify('Не удалось обработать изображение', 'error');
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await updateUser({ avatar: preview });
      setPreview(null);
      notify(t('settings.avatarSaved'), 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await updateUser({ avatar: null });
      setPreview(null);
      notify(t('settings.avatarSaved'), 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Статус Telegram загружаем один раз при открытии настроек
  useEffect(() => {
    let cancelled = false;
    apiFetch('/telegram/status')
      .then((data) => {
        if (!cancelled) setTelegram(data);
      })
      .catch(() => {
        if (!cancelled) setTelegram({ configured: false, linked: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Пока пользователь открывает бота, раз в 3 секунды проверяем, привязался ли чат
  useEffect(() => {
    if (!telegramLink) return undefined;
    let ticks = 0;
    const timer = setInterval(async () => {
      ticks += 1;
      try {
        const data = await apiFetch('/telegram/status');
        setTelegram(data);
        if (data.linked) {
          clearInterval(timer);
          setTelegramLink(null);
          notify(t('settings.telegramLinked'), 'success');
          return;
        }
      } catch (err) {
        // Сеть моргнула — попробуем на следующем тике
      }
      // Через 2 минуты перестаём опрашивать: код всё равно живёт 15 минут
      if (ticks >= 40) {
        clearInterval(timer);
        setTelegramLink(null);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [telegramLink, notify, t]);

  const handleTelegramLink = async () => {
    setTelegramBusy(true);
    try {
      const data = await apiFetch('/telegram/link', { method: 'POST' });
      setTelegramLink(data);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setTelegramBusy(false);
    }
  };

  const handleTelegramUnlink = async () => {
    setTelegramBusy(true);
    try {
      await apiFetch('/telegram/link', { method: 'DELETE' });
      setTelegram((prev) => ({ ...prev, linked: false, username: null }));
      setTelegramLink(null);
      notify(t('settings.telegramDisconnected'), 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setTelegramBusy(false);
    }
  };

  const handleTelegramTest = async () => {
    setTelegramBusy(true);
    try {
      await apiFetch('/telegram/test', { method: 'POST' });
      notify(t('settings.telegramTestSent'), 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setTelegramBusy(false);
    }
  };

  // Email меняется только после подтверждения по ссылке на новый адрес
  const handleEmailSave = async () => {
    const nextEmail = emailDraft.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setEmailError(t('settings.emailInvalid'));
      return;
    }
    setEmailSaving(true);
    try {
      const data = await apiFetch('/me', { method: 'PUT', body: { email: nextEmail } });
      const saved = data?.pendingEmail || nextEmail;
      setEmailError('');
      setPendingEmail(saved);
      notify(t('settings.emailConfirmSent', { email: saved }), 'success');
    } catch (err) {
      // Если почта на сервере не настроена, под полем уже есть предупреждение —
      // не показываем ту же фразу второй раз красным
      setEmailError(mailIssue && err.message === mailIssue ? '' : err.message);
      notify(err.message, 'error');
    } finally {
      setEmailSaving(false);
    }
  };

  // Смена пароля требует текущий пароль — так чужой не поменяет его из открытой сессии
  const handlePasswordSave = async () => {
    const { current, next, confirm } = passwords;
    if (!current) {
      notify(t('settings.passwordCurrentRequired'), 'error');
      return;
    }
    if (next.length < 6) {
      notify(t('settings.passwordShort'), 'error');
      return;
    }
    if (next !== confirm) {
      notify(t('settings.passwordMismatch'), 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      await updateUser({ currentPassword: current, password: next });
      setPasswords({ current: '', next: '', confirm: '' });
      notify(t('settings.passwordSaved'), 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="container-card settings">
      <div className="component-header">
        <h2 className="component-title">{t('settings.title')}</h2>
      </div>

      <div className="settings__content">
        <div className="settings__section">
          <h3 className="settings__section-title">{t('settings.profile')}</h3>
          <div className="settings__avatar-row">
            <div className="settings__avatar-preview">
              {currentAvatar ? (
                <img src={currentAvatar} alt="avatar" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="settings__avatar-controls">
              <div className="settings__option-description">{t('settings.avatarDesc')}</div>
              <div className="settings__avatar-buttons">
                <button
                  className="btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  {t('settings.avatarUpload')}
                </button>
                {preview && (
                  <button className="btn-secondary" onClick={handleSave} disabled={saving}>
                    {saving ? '...' : t('common.save')}
                  </button>
                )}
                {currentAvatar && !preview && (
                  <button
                    className="btn-secondary settings__avatar-remove"
                    onClick={handleRemove}
                    disabled={saving}
                  >
                    {t('settings.avatarRemove')}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="settings__section">
          <h3 className="settings__section-title">{t('settings.account')}</h3>

          <div className="settings__account-block">
            <div className="settings__switch-label">{t('settings.email')}</div>
            <p className="settings__option-description settings__option-description--left">
              {t('settings.emailDesc')}
            </p>
            <div className="settings__account-row">
              <input
                className={`form-input${emailError ? ' form-input--error' : ''}`}
                type="email"
                value={emailDraft}
                onChange={(e) => {
                  setEmailDraft(e.target.value);
                  setEmailError('');
                }}
                aria-label={t('settings.email')}
                aria-invalid={Boolean(emailError)}
                autoComplete="email"
              />
              <button className="btn-primary" onClick={handleEmailSave} disabled={emailSaving}>
                {emailSaving ? '...' : t('common.save')}
              </button>
            </div>
            {emailError ? <p className="form-group__error">{emailError}</p> : null}
            {pendingEmail ? (
              <p className="settings__hint">
                {t('settings.emailPending', { email: pendingEmail })}
              </p>
            ) : null}
            {!mailEnabled ? (
              <p className="settings__hint settings__hint--warning">
                {mailIssue || t('settings.mailNotConfigured')}
              </p>
            ) : null}
          </div>

          <div className="settings__account-block">
            <div className="settings__switch-label">{t('settings.changePassword')}</div>
            <div className="settings__account-fields">
              <input
                className="form-input"
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((prev) => ({ ...prev, current: e.target.value }))
                }
                placeholder={t('settings.currentPassword')}
                aria-label={t('settings.currentPassword')}
                autoComplete="current-password"
              />
              <input
                className="form-input"
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords((prev) => ({ ...prev, next: e.target.value }))}
                placeholder={t('settings.newPassword')}
                aria-label={t('settings.newPassword')}
                autoComplete="new-password"
              />
              <input
                className="form-input"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                placeholder={t('settings.confirmPassword')}
                aria-label={t('settings.confirmPassword')}
                autoComplete="new-password"
              />
            </div>
            <div className="settings__account-actions">
              <button
                className="btn-primary"
                onClick={handlePasswordSave}
                disabled={passwordSaving}
              >
                {passwordSaving ? '...' : t('settings.changePasswordSubmit')}
              </button>
            </div>
          </div>
        </div>

        <div className="settings__section">
          <h3 className="settings__section-title">{t('settings.icons')}</h3>
          <IconSettings />
        </div>

        <div className="settings__section">
          <h3 className="settings__section-title">{t('settings.notifications')}</h3>
          <div className="settings__telegram">
            <div className="settings__switch-label">Telegram</div>
            <p className="settings__telegram-desc">{t('settings.telegramDesc')}</p>

            {telegram && !telegram.configured && (
              <div className="settings__telegram-status settings__telegram-status--muted">
                {t('settings.telegramNotConfigured')}
              </div>
            )}

            {telegram && telegram.configured && telegram.linked && (
              <>
                <div className="settings__telegram-status">
                  {telegram.username
                    ? t('settings.telegramLinkedAs', { username: telegram.username })
                    : t('settings.telegramLinked')}
                </div>
                <div className="settings__telegram-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleTelegramTest}
                    disabled={telegramBusy}
                  >
                    {t('settings.telegramTest')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary settings__telegram-remove"
                    onClick={handleTelegramUnlink}
                    disabled={telegramBusy}
                  >
                    {t('settings.telegramDisconnect')}
                  </button>
                </div>
              </>
            )}

            {telegram && telegram.configured && !telegram.linked && !telegramLink && (
              <div className="settings__telegram-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleTelegramLink}
                  disabled={telegramBusy}
                >
                  {t('settings.telegramConnect')}
                </button>
              </div>
            )}

            {telegramLink && (
              <div className="settings__telegram-link">
                <div className="settings__telegram-hint">{t('settings.telegramHint')}</div>
                <div className="settings__telegram-actions">
                  <a
                    className="btn-primary settings__telegram-open"
                    href={telegramLink.deeplink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('settings.telegramOpenBot')}
                  </a>
                  <span className="settings__telegram-code">
                    {t('settings.telegramCode', { code: telegramLink.code })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

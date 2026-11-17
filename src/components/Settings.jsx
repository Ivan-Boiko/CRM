import React, { useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import './Settings.css';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

  const currentAvatar = preview ?? user?.avatar ?? null;
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

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
          <h3 className="settings__section-title">{t('settings.appearance')}</h3>
          {/* Тема и язык стоят рядом в одной строке — так же, как в карточке входа */}
          <div className="settings__switches">
            <div className="settings__switch">
              <ThemeToggle />
              <div className="settings__switch-label">{t('settings.theme')}</div>
              <div className="settings__option-description">{t('settings.themeDesc')}</div>
            </div>
            <div className="settings__switch">
              <LanguageToggle />
              <div className="settings__switch-label">{t('settings.languageLabel')}</div>
              <div className="settings__option-description">{t('settings.languageDesc')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

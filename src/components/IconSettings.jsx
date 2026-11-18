// IconSettings.jsx — замена иконок приложения своими файлами PNG или SVG.
import React, { useRef, useState } from 'react';
import AppIcon from './AppIcon';
import { EditIcon, DeleteIcon, ReturnIcon } from './ActionIcons';
import { useIcons } from '../context/IconContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

// Те же лимиты, что и на сервере
const MAX_ICON_BYTES = 64 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/svg+xml'];

// Все иконки приложения, которые можно заменить
const ICON_SLOTS = [
  { key: 'nav.tasks', label: 'icons.navTasks', fallback: '✓' },
  { key: 'nav.diary', label: 'icons.navDiary', fallback: '📔' },
  { key: 'nav.analytics', label: 'icons.navAnalytics', fallback: '📊' },
  { key: 'nav.settings', label: 'icons.navSettings', fallback: '⚙️' },
  { key: 'bell', label: 'icons.bell', fallback: '🔔' },
  { key: 'action.edit', label: 'icons.actionEdit', fallback: <EditIcon /> },
  { key: 'action.delete', label: 'icons.actionDelete', fallback: <DeleteIcon /> },
  { key: 'action.return', label: 'icons.actionReturn', fallback: <ReturnIcon /> },
];

const readDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const IconSettings = () => {
  const { t } = useLanguage();
  const { notify } = useToast();
  const { icons, localOnly, saveIcon, removeIcon } = useIcons();
  const inputsRef = useRef({});
  const [busyKey, setBusyKey] = useState('');

  const handleFile = async (key, event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      notify(t('settings.iconBadType'), 'error');
      return;
    }
    if (file.size > MAX_ICON_BYTES) {
      notify(t('settings.iconTooLarge'), 'error');
      return;
    }
    setBusyKey(key);
    try {
      const dataUrl = await readDataUrl(file);
      await saveIcon(key, dataUrl);
      notify(t('settings.iconSaved'), 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyKey('');
    }
  };

  const handleReset = async (key) => {
    setBusyKey(key);
    try {
      await removeIcon(key);
      notify(t('settings.iconRemoved'), 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="settings__icons">
      <p className="settings__option-description settings__option-description--left">
        {t('settings.iconsDesc')}
      </p>
      {localOnly ? (
        <p className="settings__hint settings__hint--warning">{t('settings.iconLocalOnly')}</p>
      ) : null}
      <div className="settings__icons-list">
        {ICON_SLOTS.map((slot) => (
          <div className="settings__icon-row" key={slot.key}>
            <span className="settings__icon-preview">
              <AppIcon name={slot.key} fallback={slot.fallback} />
            </span>
            <div className="settings__icon-info">
              <div className="settings__switch-label">{t(slot.label)}</div>
              {icons[slot.key] ? (
                <span className="settings__icon-status">{t('settings.iconCustom')}</span>
              ) : null}
            </div>
            <div className="settings__icon-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => inputsRef.current[slot.key]?.click()}
                disabled={busyKey === slot.key}
              >
                {t('settings.iconUpload')}
              </button>
              {icons[slot.key] ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleReset(slot.key)}
                  disabled={busyKey === slot.key}
                >
                  {t('settings.iconReset')}
                </button>
              ) : null}
            </div>
            <input
              ref={(el) => {
                inputsRef.current[slot.key] = el;
              }}
              type="file"
              accept="image/png,image/svg+xml,.png,.svg"
              className="settings__icon-input"
              onChange={(event) => handleFile(slot.key, event)}
              aria-label={`${t('settings.iconUpload')}: ${t(slot.label)}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default IconSettings;

import React from 'react';
import './LanguageToggle.css';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = ({ compact = false }) => {
  const { lang, setLang, t } = useLanguage();
  const isRussian = lang === 'ru';

  // Компактная кнопка для шапки и страницы входа: текущий язык вместо плашки
  if (compact) {
    return (
      <button
        type="button"
        className="language-toggle language-toggle--icon"
        onClick={() => setLang(isRussian ? 'en' : 'ru')}
        aria-label={t('settings.languageLabel')}
        title={t('settings.languageLabel')}
      >
        {lang.toUpperCase()}
      </button>
    );
  }

  return (
    <div
      className={`language-toggle ${isRussian ? 'russian-container' : ''}`}
      onClick={() => setLang(isRussian ? 'en' : 'ru')}
    >
      <div className={`toggle-circle_lang ${isRussian ? 'russian' : ''}`}>{lang}</div>
    </div>
  );
};

export default LanguageToggle;

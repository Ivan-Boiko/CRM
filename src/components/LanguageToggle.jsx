import React from 'react';
import './LanguageToggle.css';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();
  const isRussian = lang === 'ru';

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

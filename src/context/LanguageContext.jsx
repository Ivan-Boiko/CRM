import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'ru');

  useEffect(() => {
    document.body.dataset.language = lang;
    localStorage.setItem('language', lang);
  }, [lang]);

  // Перевод по ключу. Если перевода нет — возвращаем сам ключ.
  const t = useCallback(
    (key, params) => {
      const dict = translations[lang] || translations.ru;
      let value = dict[key] ?? translations.ru[key] ?? key;
      if (params) {
        Object.keys(params).forEach((name) => {
          value = value.replace(new RegExp(`{${name}}`, 'g'), params[name]);
        });
      }
      return value;
    },
    [lang]
  );

  // Форматирование даты под текущую локаль
  const formatDate = useCallback(
    (value) => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

// BottomNav.jsx — нижняя таб-панель, которая на телефонах заменяет меню слева
import React from 'react';
import './BottomNav.css';
import { useLanguage } from '../../context/LanguageContext';

const BottomNav = ({ onMenuClick, activeItemId }) => {
  const { t } = useLanguage();

  // Те же разделы, что и в сайдбаре, — порядок и id совпадают
  const items = [
    { id: 1, title: t('nav.tasks'), icon: '✓' },
    { id: 2, title: t('nav.diary'), icon: '📔' },
    { id: 3, title: t('nav.analytics'), icon: '📊' },
    { id: 4, title: t('nav.settings'), icon: '⚙️' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const isActive = activeItemId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => onMenuClick(item.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav__label">{item.title}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;

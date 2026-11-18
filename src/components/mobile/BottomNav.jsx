// BottomNav.jsx — нижняя таб-панель, которая на телефонах заменяет меню слева
import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';
import { useLanguage } from '../../context/LanguageContext';
import AppIcon from '../AppIcon';

const BottomNav = () => {
  const { t } = useLanguage();

  // Те же разделы и адреса, что и в сайдбаре
  const items = [
    { id: 1, to: '/main/tasks', title: t('nav.tasks'), icon: '✓', iconKey: 'nav.tasks' },
    { id: 2, to: '/main/diary', title: t('nav.diary'), icon: '📔', iconKey: 'nav.diary' },
    { id: 3, to: '/main/analytics', title: t('nav.analytics'), icon: '📊', iconKey: 'nav.analytics' },
    { id: 4, to: '/main/settings', title: t('nav.settings'), icon: '⚙️', iconKey: 'nav.settings' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            <AppIcon name={item.iconKey} fallback={item.icon} />
          </span>
          <span className="bottom-nav__label">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;

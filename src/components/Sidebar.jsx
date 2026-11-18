import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AppIcon from './AppIcon';

const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Пункты меню — ссылки: каждый раздел имеет свой адрес
  const menuItems = [
    { id: 1, to: '/main/tasks', title: t('nav.tasks'), icon: '✓', iconKey: 'nav.tasks' },
    { id: 2, to: '/main/diary', title: t('nav.diary'), icon: '📔', iconKey: 'nav.diary' },
    { id: 3, to: '/main/analytics', title: t('nav.analytics'), icon: '📊', iconKey: 'nav.analytics' },
    { id: 4, to: '/main/settings', title: t('nav.settings'), icon: '⚙️', iconKey: 'nav.settings' },
  ];

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="sidebar">
      <div className="sidebar__user">
        {user?.avatar ? (
          <img className="sidebar__avatar" src={user.avatar} alt={user.name || 'avatar'} />
        ) : (
          <div className="sidebar__avatar">{initial}</div>
        )}
        <div className="sidebar__user-info">
          <h3 className="sidebar__user-title">{t('app.dashboard')}</h3>
          <p className="sidebar__user-subtitle">{user?.name || t('app.welcome')}</p>
        </div>
      </div>
      <nav className="sidebar__menu">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__menu-item${isActive ? ' sidebar__menu-item--active' : ''}`
            }
          >
            <span className={`sidebar__menu-icon ${index === 0 ? 'sidebar__menu-icon--first' : ''}`}>
              <AppIcon name={item.iconKey} fallback={item.icon} />
            </span>
            <span className="sidebar__menu-title">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;

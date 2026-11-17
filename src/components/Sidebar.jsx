import React from 'react';
import './Sidebar.css';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ onMenuClick, activeItemId }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { id: 1, title: t('nav.tasks'), icon: '✓' },
    { id: 2, title: t('nav.diary'), icon: '📔' },
    { id: 3, title: t('nav.analytics'), icon: '📊' },
    { id: 4, title: t('nav.settings'), icon: '⚙️' },
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
          <div
            key={item.id}
            className={`sidebar__menu-item ${activeItemId === item.id ? 'sidebar__menu-item--active' : ''}`}
            onClick={() => onMenuClick(item.id)}
          >
            <span className={`sidebar__menu-icon ${index === 0 ? 'sidebar__menu-icon--first' : ''}`}>
              {item.icon}
            </span>
            <span className="sidebar__menu-title">{item.title}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;

import React from 'react';
import './TopBar.css';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const TopBar = ({ search = '', onSearch }) => {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const { t } = useLanguage();

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    notify(t('toast.loggedOut'), 'info');
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <span>CRM Task Manager</span>
        </div>
        <div className="search-container">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder={t('topbar.search')}
            className="search-input"
            aria-label={t('topbar.search')}
          />
        </div>
      </div>
      <div className="topbar-right">
        <div className="notifications">
          <span className="notification-icon">🔔</span>
        </div>
        <div className="user-profile">
          {user?.avatar ? (
            <img className="profile-avatar" src={user.avatar} alt={user.name || 'avatar'} />
          ) : (
            <div className="profile-avatar">{initial}</div>
          )}
        </div>
        <button className="topbar__logout" onClick={handleLogout}>
          {t('topbar.logout')}
        </button>
      </div>
    </div>
  );
};

export default TopBar;

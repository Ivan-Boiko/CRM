import React from 'react';
import './Sidebar.css';

const Sidebar = ({ onMenuClick, activeItemId }) => {
  const menuItems = [
    { id: 1, title: 'Задачи', icon: '✓' },
    { id: 2, title: 'Скрипты', icon: '📝' },
    { id: 3, title: 'Дневник', icon: '📔' },
    { id: 4, title: 'Клиенты', icon: '➜' },
    { id: 5, title: 'Аналитика', icon: '📊' },
    { id: 6, title: 'Настройки', icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar__user">
        <img src="/avatar.png" alt="User" className="sidebar__avatar" />
        <div className="sidebar__user-info">
          <h3 className="sidebar__user-title">Панель управления</h3>
          <p className="sidebar__user-subtitle">Добро пожаловать</p>
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
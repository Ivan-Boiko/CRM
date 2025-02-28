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
      <div className="user-info">
        <img src="/avatar.png" alt="User" className="user-avatar" />
        <div className="user-details">
          <h3>Панель управления</h3>
          <p>Добро пожаловать</p>
        </div>
      </div>
      <nav className="menu">
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`menu-item ${activeItemId === item.id ? 'active' : ''}`}
            onClick={() => onMenuClick(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span className="title">{item.title}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
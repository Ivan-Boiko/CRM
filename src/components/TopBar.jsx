import React from 'react';
import './TopBar.css';

const TopBar = () => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <span>CRM Task Manager</span>
        </div>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search" 
            className="search-input"
          />
        </div>
      </div>
      <div className="topbar-right">
        <div className="notifications">
          <span className="notification-icon">🔔</span>
        </div>
        <div className="user-profile">
          <img src="/avatar.png" alt="Profile" className="profile-avatar" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
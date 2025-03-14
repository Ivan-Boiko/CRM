import React from 'react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import './Settings.css';

const Settings = () => {
  return (
    <div className="container-card settings">
      <div className="component-header">
        <h2 className="component-title">Настройки</h2>
      </div>

      <div className="settings__content">
        <div className="settings__section">
          <h3 className="settings__section-title">Внешний вид</h3>
          <div className="settings__option">
            <div className="settings__option-label">Тема оформления</div>
            <div className="settings__option-control">
              <ThemeToggle />
              <div className="settings__option-description">
                Переключение между светлой и темной темой
              </div>
            </div>
          </div>
        </div>

        <div className="settings__section">
          <h3 className="settings__section-title">Язык</h3>
          <div className="settings__option">
            <div className="settings__option-label">Язык интерфейса</div>
            <div className="settings__option-control">
              <LanguageToggle />
              <div className="settings__option-description">
                Переключение между русским и английским языком
              </div>
            </div>
          </div>
        </div>
            <button className="btn-primary settings__save-btn">Сохранить изменения</button>
        </div>
      </div>
  );
};

export default Settings;
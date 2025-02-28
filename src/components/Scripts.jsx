import React, { useState } from 'react';
import './Scripts.css';

const Scripts = () => {
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Здесь будет логика сохранения
    setShowForm(false);
  };

  return (
    <div className="scripts-container">
      {!showForm ? (
        <button 
          className="scripts__create-btn"
          onClick={() => setShowForm(true)}
        >
          Создать запись
        </button>
      ) : (
        <form className="scripts__form" onSubmit={handleSubmit}>
          <div className="scripts__form-group">
            <label htmlFor="title">Название</label>
            <input
              type="text"
              id="title"
              className="scripts__input"
              placeholder="Введите название"
            />
          </div>

          <div className="scripts__form-group">
            <label htmlFor="description">Описание</label>
            <input
              type="text"
              id="description"
              className="scripts__input"
              placeholder="Добавьте краткое описание"
            />
          </div>

          <div className="scripts__form-group">
            <label htmlFor="mainScript">Скрипт</label>
            <textarea
              id="mainScript"
              className="scripts__textarea"
              placeholder="Введите текст скрипта"
              rows="10"
            />
          </div>

          <div className="scripts__buttons">
            <button type="submit" className="scripts__submit-btn">
              Сохранить
            </button>
            <button 
              type="button" 
              className="scripts__cancel-btn"
              onClick={() => setShowForm(false)}
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Scripts;
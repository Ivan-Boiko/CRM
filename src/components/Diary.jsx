import React, { useState } from 'react';
import './common.css';
import './Diary.css';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [newEntry, setNewEntry] = useState({
    text: ''
  });
  const [editText, setEditText] = useState('');

  const handleInputChange = (e) => {
    const { value } = e.target;
    setNewEntry({
      ...newEntry,
      text: value
    });
  };

  const handleAddEntry = () => {
    if (newEntry.text.trim()) {
      setEntries([
        {
          id: Date.now(),
          text: newEntry.text,
          date: new Date().toLocaleString()
        },
        ...entries
      ]);
      setNewEntry({
        text: ''
      });
      setIsModalOpen(false);
    }
  };

  const handleEdit = (id, text) => {
    setIsEditing(id);
    setEditText(text);
  };

  const saveEdit = (id) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, text: editText } : entry
    ));
    setIsEditing(null);
  };

  return (
    <div className="container-card diary">
      <div className="component-header">
        <h2 className="component-title">Дневник</h2>
        <button 
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Добавить запись
        </button>
      </div>

      {entries.length > 0 ? (
        <div className="diary__list">
          {entries.map(entry => (
            <div key={entry.id} className="diary-card">
              {isEditing === entry.id ? (
                <div className="diary-card__edit">
                  <textarea
                    className="diary-card__edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="diary-card__edit-buttons">
                    <button 
                      className="btn-primary diary-card__save-btn"
                      onClick={() => saveEdit(entry.id)}
                    >
                      Сохранить
                    </button>
                    <button 
                      className="btn-secondary diary-card__cancel-btn"
                      onClick={() => setIsEditing(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="diary-card__content">
                    <p className="diary-card__text">{entry.text}</p>
                    <span className="diary-card__date">{entry.date}</span>
                  </div>
                  <button 
                    className="btn-secondary diary-card__edit-btn"
                    onClick={() => handleEdit(entry.id, entry.text)}
                  >
                    Редактировать
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Дневник пуст</p>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>Добавить новую запись</h3>
              <button 
                className="modal__close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="text">Текст записи *</label>
                <textarea
                  id="text"
                  value={newEntry.text}
                  onChange={handleInputChange}
                  placeholder="Напишите новую запись..."
                  rows="6"
                  required
                />
              </div>
            </div>
            <div className="modal__footer">
              <button 
                className="btn-secondary modal__cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary modal__submit"
                onClick={handleAddEntry}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diary;
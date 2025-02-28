import React, { useState } from 'react';
import './Diary.css';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [isEditing, setIsEditing] = useState(null);
  const [editText, setEditText] = useState('');

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      setEntries([
        {
          id: Date.now(),
          text: newEntry,
          date: new Date().toLocaleString()
        },
        ...entries
      ]);
      setNewEntry('');
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
    <div className="diary">
      <div className="diary__input-section">
        <textarea
          className="diary__textarea"
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Напишите новую запись..."
        />
        <button 
          className="diary__add-btn"
          onClick={handleAddEntry}
        >
          Добавить запись
        </button>
      </div>

      <div className="diary__entries">
        {entries.map(entry => (
          <div key={entry.id} className="diary__entry">
            {isEditing === entry.id ? (
              <div className="diary__edit-form">
                <textarea
                  className="diary__edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="diary__edit-buttons">
                  <button 
                    className="diary__save-btn"
                    onClick={() => saveEdit(entry.id)}
                  >
                    Сохранить
                  </button>
                  <button 
                    className="diary__cancel-btn"
                    onClick={() => setIsEditing(null)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="diary__entry-content">
                  <p className="diary__entry-text">{entry.text}</p>
                  <span className="diary__entry-date">{entry.date}</span>
                </div>
                <button 
                  className="diary__edit-btn"
                  onClick={() => handleEdit(entry.id, entry.text)}
                >
                  Редактировать
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Diary;
import React, { useState } from 'react';
import './common.css';
import './ScriptsDiary.css';

const Scripts = () => {
  const [scripts, setScripts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [newScript, setNewScript] = useState({
    title: '',
    description: '',
    content: ''
  });
  const [editScript, setEditScript] = useState({
    title: '',
    description: '',
    content: ''
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewScript({
      ...newScript,
      [id]: value
    });
  };

  const handleEditChange = (e) => {
    const { id, value } = e.target;
    setEditScript({
      ...editScript,
      [id]: value
    });
  };

  const handleAddScript = () => {
    if (newScript.title.trim()) {
      setScripts([
        {
          id: Date.now(),
          ...newScript,
          date: new Date().toLocaleString()
        },
        ...scripts
      ]);
      setNewScript({
        title: '',
        description: '',
        content: ''
      });
      setIsModalOpen(false);
    }
  };

  const handleEdit = (id) => {
    const scriptToEdit = scripts.find(script => script.id === id);
    setEditScript({
      title: scriptToEdit.title,
      description: scriptToEdit.description,
      content: scriptToEdit.content
    });
    setIsEditing(id);
  };

  const saveEdit = (id) => {
    setScripts(scripts.map(script => 
      script.id === id ? { ...script, ...editScript } : script
    ));
    setIsEditing(null);
  };

  return (
    <div className="container-card scripts">
      <div className="component-header">
        <h2 className="component-title">Скрипты</h2>
        <button 
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Добавить скрипт
        </button>
      </div>

      {scripts.length > 0 ? (
        <div className="scripts__list">
          {scripts.map(script => (
            <div key={script.id} className="script-card">
              {isEditing === script.id ? (
                <div className="script-card__edit-form">
                  <div className="script-card__form-group">
                    <label className="script-card__form-label" htmlFor={`edit-title-${script.id}`}>Название</label>
                    <input
                      type="text"
                      id="title"
                      className="script-card__form-input"
                      value={editScript.title}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="script-card__form-group">
                    <label className="script-card__form-label" htmlFor={`edit-description-${script.id}`}>Описание</label>
                    <input
                      type="text"
                      id="description"
                      className="script-card__form-input"
                      value={editScript.description}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="script-card__form-group">
                    <label className="script-card__form-label" htmlFor={`edit-content-${script.id}`}>Скрипт</label>
                    <textarea
                      id="content"
                      className="script-card__form-textarea"
                      value={editScript.content}
                      onChange={handleEditChange}
                      rows="10"
                    />
                  </div>
                  <div className="script-card__form-buttons">
                    <button 
                      className="script-card__save-btn"
                      onClick={() => saveEdit(script.id)}
                    >
                      Сохранить
                    </button>
                    <button 
                      className="script-card__cancel-btn"
                      onClick={() => setIsEditing(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="script-card__header">
                    <h3 className="script-card__title">{script.title}</h3>
                    <span className="script-card__date">{script.date}</span>
                  </div>
                  <p className="script-card__description">{script.description}</p>
                  <div className="script-card__content">
                    <pre>{script.content}</pre>
                  </div>
                  <button 
                    className="script-card__edit-btn"
                    onClick={() => handleEdit(script.id)}
                  >
                    Редактировать
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="scripts__empty">
          <p>Список скриптов пуст</p>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal scripts__modal">
            <div className="modal__header">
              <h3>Добавить новый скрипт</h3>
              <button 
                className="modal__close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="title">Название *</label>
                <input
                  type="text"
                  id="title"
                  value={newScript.title}
                  onChange={handleInputChange}
                  placeholder="Введите название скрипта"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Описание</label>
                <input
                  type="text"
                  id="description"
                  value={newScript.description}
                  onChange={handleInputChange}
                  placeholder="Добавьте краткое описание"
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">Скрипт *</label>
                <textarea
                  id="content"
                  value={newScript.content}
                  onChange={handleInputChange}
                  placeholder="Введите текст скрипта"
                  rows="10"
                />
              </div>
            </div>
            <div className="modal__footer">
              <button 
                className="modal__cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Отмена
              </button>
              <button 
                className="modal__submit"
                onClick={handleAddScript}
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

export default Scripts;
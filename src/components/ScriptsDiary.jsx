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
    <div className="container-card scripts-container">
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
            <div key={script.id} className="script-item">
              {isEditing === script.id ? (
                <div className="script-item__edit">
                  <div className="scripts__form-group">
                    <label htmlFor={`edit-title-${script.id}`}>Название</label>
                    <input
                      type="text"
                      id="title"
                      className="scripts__input"
                      value={editScript.title}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="scripts__form-group">
                    <label htmlFor={`edit-description-${script.id}`}>Описание</label>
                    <input
                      type="text"
                      id="description"
                      className="scripts__input"
                      value={editScript.description}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="scripts__form-group">
                    <label htmlFor={`edit-content-${script.id}`}>Скрипт</label>
                    <textarea
                      id="content"
                      className="scripts__textarea"
                      value={editScript.content}
                      onChange={handleEditChange}
                      rows="10"
                    />
                  </div>
                  <div className="scripts__buttons">
                    <button 
                      className="scripts__submit-btn"
                      onClick={() => saveEdit(script.id)}
                    >
                      Сохранить
                    </button>
                    <button 
                      className="scripts__cancel-btn"
                      onClick={() => setIsEditing(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="script-item__header">
                    <h3 className="script-item__title">{script.title}</h3>
                    <span className="script-item__date">{script.date}</span>
                  </div>
                  <p className="script-item__description">{script.description}</p>
                  <div className="script-item__content">
                    <pre>{script.content}</pre>
                  </div>
                  <button 
                    className="script-item__edit-btn"
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
          <div className="modal">
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
import React, { useCallback, useEffect, useState } from 'react';
import './common.css';
import './ScriptsDiary.css';
import { apiFetch } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_SCRIPT = { title: '', description: '', content: '' };

const Scripts = () => {
  const [scripts, setScripts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newScript, setNewScript] = useState(EMPTY_SCRIPT);
  const [editScript, setEditScript] = useState(EMPTY_SCRIPT);
  const { notify } = useToast();
  const { t, formatDate } = useLanguage();

  const loadScripts = useCallback(async () => {
    try {
      const data = await apiFetch('/scripts');
      setScripts(data);
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [notify]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewScript((prev) => ({ ...prev, [id]: value }));
  };

  const handleEditChange = (e) => {
    const { id, value } = e.target;
    setEditScript((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddScript = async () => {
    if (!newScript.title.trim()) return;
    try {
      await apiFetch('/scripts', {
        method: 'POST',
        body: { ...newScript, date: new Date().toISOString() },
      });
      notify(t('toast.scriptAdded'), 'success');
      setNewScript(EMPTY_SCRIPT);
      setIsModalOpen(false);
      loadScripts();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEdit = (script) => {
    setEditScript({
      title: script.title || '',
      description: script.description || '',
      content: script.content || '',
    });
    setEditingId(script.id);
  };

  const saveEdit = async (id) => {
    try {
      await apiFetch(`/scripts/${id}`, { method: 'PUT', body: editScript });
      notify(t('toast.scriptUpdated'), 'success');
      setEditingId(null);
      loadScripts();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.delete') + '?')) return;
    try {
      await apiFetch(`/scripts/${id}`, { method: 'DELETE' });
      notify(t('toast.deleted'), 'success');
      loadScripts();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="container-card scripts">
      <div className="component-header">
        <h2 className="component-title">{t('scripts.title')}</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          {t('scripts.add')}
        </button>
      </div>

      {scripts.length > 0 ? (
        <div className="scripts__list">
          {scripts.map((script) => (
            <div key={script.id} className="script-card">
              {editingId === script.id ? (
                <div className="script-card__edit-form">
                  <div className="script-card__form-group">
                    <label className="script-card__form-label">{t('scripts.field.title')}</label>
                    <input
                      type="text"
                      id="title"
                      className="script-card__form-input"
                      value={editScript.title}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="script-card__form-group">
                    <label className="script-card__form-label">{t('scripts.field.description')}</label>
                    <input
                      type="text"
                      id="description"
                      className="script-card__form-input"
                      value={editScript.description}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="script-card__form-group">
                    <label className="script-card__form-label">{t('scripts.field.content')}</label>
                    <textarea
                      id="content"
                      className="script-card__form-textarea"
                      value={editScript.content}
                      onChange={handleEditChange}
                      rows="10"
                    />
                  </div>
                  <div className="script-card__form-buttons">
                    <button className="script-card__save-btn" onClick={() => saveEdit(script.id)}>
                      {t('common.save')}
                    </button>
                    <button className="script-card__cancel-btn" onClick={() => setEditingId(null)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="script-card__header">
                    <h3 className="script-card__title">{script.title}</h3>
                    <span className="script-card__date">{formatDate(script.date)}</span>
                  </div>
                  <p className="script-card__description">{script.description}</p>
                  <div className="script-card__content">
                    <pre>{script.content}</pre>
                  </div>
                  <div className="script-card__actions">
                    <button className="script-card__edit-btn" onClick={() => handleEdit(script)}>
                      {t('common.edit')}
                    </button>
                    <button
                      className="script-card__edit-btn script-card__edit-btn--danger"
                      onClick={() => handleDelete(script.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="scripts__empty">
          <p>{t('scripts.empty')}</p>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal scripts__modal">
            <div className="modal__header">
              <h3>{t('scripts.modal.add')}</h3>
              <button className="modal__close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="title">{t('scripts.field.title')} *</label>
                <input
                  type="text"
                  id="title"
                  value={newScript.title}
                  onChange={handleInputChange}
                  placeholder={t('scripts.placeholder.title')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">{t('scripts.field.description')}</label>
                <input
                  type="text"
                  id="description"
                  value={newScript.description}
                  onChange={handleInputChange}
                  placeholder={t('scripts.placeholder.description')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">{t('scripts.field.content')} *</label>
                <textarea
                  id="content"
                  value={newScript.content}
                  onChange={handleInputChange}
                  placeholder={t('scripts.placeholder.content')}
                  rows="10"
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="modal__cancel" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="modal__submit" onClick={handleAddScript}>
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scripts;

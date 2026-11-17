import React, { useCallback, useEffect, useState } from 'react';
import './common.css';
import './Diary.css';
import { apiFetch } from '../api';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const Diary = ({ search = '' }) => {
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState({ text: '' });
  const [editText, setEditText] = useState('');
  // Запись, ожидающая подтверждения удаления
  const [pendingDelete, setPendingDelete] = useState(null);
  const { notify } = useToast();
  const { t, formatDate } = useLanguage();

  const loadEntries = useCallback(async () => {
    try {
      const data = await apiFetch('/diary');
      setEntries(data);
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [notify]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAddEntry = async () => {
    if (!newEntry.text.trim()) return;
    try {
      await apiFetch('/diary', {
        method: 'POST',
        body: { text: newEntry.text, date: new Date().toISOString() },
      });
      notify(t('toast.entryAdded'), 'success');
      setNewEntry({ text: '' });
      setIsModalOpen(false);
      loadEntries();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = async (id) => {
    try {
      await apiFetch(`/diary/${id}`, { method: 'PUT', body: { text: editText } });
      notify(t('toast.entryUpdated'), 'success');
      setEditingId(null);
      loadEntries();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Удаление подтверждается модальным окном, а не системным диалогом браузера
  const removeEntry = async (id) => {
    try {
      await apiFetch(`/diary/${id}`, { method: 'DELETE' });
      notify(t('toast.deleted'), 'success');
      loadEntries();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const confirmDelete = () => {
    const entry = pendingDelete;
    setPendingDelete(null);
    if (entry) removeEntry(entry.id);
  };

  // Клиентская фильтрация по строке поиска из TopBar
  const query = search.trim().toLowerCase();
  const visibleEntries = query
    ? entries.filter((entry) => entry.text && String(entry.text).toLowerCase().includes(query))
    : entries;

  return (
    <div className="container-card diary">
      <div className="component-header">
        <h2 className="component-title">{t('diary.title')}</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          {t('diary.add')}
        </button>
      </div>

      {visibleEntries.length > 0 ? (
        <div className="diary__list">
          {visibleEntries.map((entry) => (
            <div key={entry.id} className="diary-card">
              {editingId === entry.id ? (
                <div className="diary-card__edit">
                  <textarea
                    className="diary-card__edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="diary-card__edit-buttons">
                    <button className="diary-card__save-btn" onClick={() => saveEdit(entry.id)}>
                      {t('common.save')}
                    </button>
                    <button className="diary-card__cancel-btn" onClick={() => setEditingId(null)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="diary-card__content">
                    <p className="diary-card__text">{entry.text}</p>
                    <span className="diary-card__date">{formatDate(entry.date)}</span>
                  </div>
                  <div className="diary-card__actions">
                    <button
                      className="diary-card__edit-btn"
                      onClick={() => handleEdit(entry.id, entry.text)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="diary-card__edit-btn diary-card__edit-btn--danger"
                      onClick={() => setPendingDelete(entry)}
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
        <div className="diary__empty">
          <p>{query ? t('common.searchEmpty') : t('diary.empty')}</p>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal diary__modal">
            <div className="modal__header">
              <h3>{t('diary.modal.add')}</h3>
              <button className="modal__close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="text">{t('diary.field.text')} *</label>
                <textarea
                  id="text"
                  value={newEntry.text}
                  onChange={(e) => setNewEntry({ text: e.target.value })}
                  placeholder={t('diary.placeholder')}
                  rows="6"
                  required
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="modal__cancel" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="modal__submit" onClick={handleAddEntry}>
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('confirm.deleteEntryTitle')}
        message={pendingDelete ? `${pendingDelete.text}\n${t('confirm.deleteText')}` : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Diary;

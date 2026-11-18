import React, { useCallback, useEffect, useState } from 'react';
import './common.css';
import './Diary.css';
import { apiFetch } from '../api';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_ENTRY = { topic: '', text: '' };

const Diary = ({ search = '' }) => {
  const [entries, setEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState(EMPTY_ENTRY);
  // Тема и текст записи при редактировании
  const [editDraft, setEditDraft] = useState(EMPTY_ENTRY);
  // Незаполненное обязательное поле подсвечиваем красным
  const [errors, setErrors] = useState({});
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

  const openAdd = () => {
    setNewEntry(EMPTY_ENTRY);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleAddEntry = async () => {
    if (!newEntry.text.trim()) {
      setErrors({ text: t('diary.field.textRequired') });
      return;
    }
    try {
      await apiFetch('/diary', {
        method: 'POST',
        body: {
          topic: newEntry.topic.trim(),
          text: newEntry.text,
          date: new Date().toISOString(),
        },
      });
      notify(t('toast.entryAdded'), 'success');
      setNewEntry(EMPTY_ENTRY);
      setErrors({});
      setIsModalOpen(false);
      loadEntries();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setEditDraft({ topic: entry.topic || '', text: entry.text || '' });
    setErrors({});
  };

  const saveEdit = async (id) => {
    if (!editDraft.text.trim()) {
      setErrors({ text: t('diary.field.textRequired') });
      return;
    }
    try {
      await apiFetch(`/diary/${id}`, {
        method: 'PUT',
        body: { topic: editDraft.topic.trim(), text: editDraft.text },
      });
      notify(t('toast.entryUpdated'), 'success');
      setEditingId(null);
      setErrors({});
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

  // Клиентская фильтрация по строке поиска из TopBar: тема и текст
  const query = search.trim().toLowerCase();
  const visibleEntries = query
    ? entries.filter((entry) =>
        [entry.topic, entry.text].some(
          (value) => value && String(value).toLowerCase().includes(query)
        )
      )
    : entries;

  return (
    <div className="container-card diary">
      <div className="component-header">
        <h2 className="component-title">{t('diary.title')}</h2>
        <button className="btn-primary" onClick={openAdd}>
          {t('diary.add')}
        </button>
      </div>

      {visibleEntries.length > 0 ? (
        <div className="diary__list">
          {visibleEntries.map((entry) => (
            <div key={entry.id} className="diary-card">
              {editingId === entry.id ? (
                <div className="diary-card__edit">
                  <input
                    type="text"
                    className="diary-card__edit-topic"
                    value={editDraft.topic}
                    onChange={(e) =>
                      setEditDraft((prev) => ({ ...prev, topic: e.target.value }))
                    }
                    placeholder={t('diary.topicPlaceholder')}
                    aria-label={t('diary.field.topic')}
                  />
                  <textarea
                    className={`diary-card__edit-textarea${
                      errors.text ? ' form-input--error' : ''
                    }`}
                    value={editDraft.text}
                    onChange={(e) => {
                      setEditDraft((prev) => ({ ...prev, text: e.target.value }));
                      if (errors.text) setErrors({});
                    }}
                    aria-invalid={Boolean(errors.text)}
                  />
                  {errors.text ? <p className="form-group__error">{errors.text}</p> : null}
                  <div className="diary-card__edit-buttons">
                    <button className="btn-primary" onClick={() => saveEdit(entry.id)}>
                      {t('common.save')}
                    </button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="diary-card__content">
                    <div className="diary-card__body">
                      {entry.topic ? (
                        <h3 className="diary-card__topic">{entry.topic}</h3>
                      ) : null}
                      <p className="diary-card__text">{entry.text}</p>
                    </div>
                    <span className="diary-card__date">{formatDate(entry.date)}</span>
                  </div>
                  <div className="diary-card__actions">
                    <button className="btn-secondary" onClick={() => handleEdit(entry)}>
                      {t('common.edit')}
                    </button>
                    <button
                      className="btn-secondary btn-secondary--danger"
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
                <label htmlFor="topic">{t('diary.field.topic')}</label>
                <input
                  type="text"
                  id="topic"
                  value={newEntry.topic}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, topic: e.target.value }))}
                  placeholder={t('diary.topicPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="text">{t('diary.field.text')} *</label>
                <textarea
                  id="text"
                  className={errors.text ? 'form-input--error' : undefined}
                  value={newEntry.text}
                  onChange={(e) => {
                    setNewEntry((prev) => ({ ...prev, text: e.target.value }));
                    if (errors.text) setErrors({});
                  }}
                  placeholder={t('diary.placeholder')}
                  rows="6"
                  required
                  aria-invalid={Boolean(errors.text)}
                />
                {errors.text ? <p className="form-group__error">{errors.text}</p> : null}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-primary" onClick={handleAddEntry}>
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('confirm.deleteEntryTitle')}
        message={
          pendingDelete
            ? `${pendingDelete.topic || pendingDelete.text}\n${t('confirm.deleteText')}`
            : ''
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Diary;

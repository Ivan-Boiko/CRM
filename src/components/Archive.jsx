import React, { useEffect, useState } from 'react';
import './TaskTable.css';
import './Archive.css';
import { apiFetch } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { DeleteIcon, ReturnIcon } from './ActionIcons';
import AppIcon from './AppIcon';
import ConfirmDialog from './ConfirmDialog';
import TasksTabs from './TasksTabs';
import TaskFilter, { applyTaskFilter } from './TaskFilter';

// Архив выполненных задач: редактирование недоступно, но можно добавить сколько угодно
// комментариев и удалить задачу.
const Archive = ({
  tasks = [],
  subtasksByParent = {},
  search = '',
  onRefresh,
  tab,
  onTabChange,
  filter,
  onFilterChange,
}) => {
  // Черновики новых комментариев по id задачи
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  // Задача, ожидающая подтверждения удаления
  const [pendingDelete, setPendingDelete] = useState(null);
  // Задача, которую возвращают в работу, и причина возврата
  const [returning, setReturning] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returningBusy, setReturningBusy] = useState(false);
  const { notify } = useToast();
  const { t, formatDate } = useLanguage();

  // Клиентская фильтрация по строке поиска из TopBar + сортировка выбранным фильтром
  const query = search.trim().toLowerCase();
  const visibleTasks = applyTaskFilter(
    tasks
      .filter((task) => task.status === 'done')
      .filter((task) =>
        query
          ? [task.name, task.description, ...(task.comments || []).map((comment) => comment.text)].some(
              (value) => value && String(value).toLowerCase().includes(query)
            )
          : true
      ),
    filter
  );

  const getDraft = (id) => drafts[id] || '';

  const handleDraftChange = (id, value) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  };

  // Новый комментарий добавляется отдельной записью, старые остаются на месте
  const handleAddComment = async (task) => {
    const text = getDraft(task.id).trim();
    if (!text) return;
    setSavingId(task.id);
    try {
      await apiFetch(`/tasks/${task.id}/comments`, { method: 'POST', body: { text } });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      notify(t('toast.commentAdded'), 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const closeReturn = () => {
    setReturning(null);
    setReturnReason('');
  };

  // Esc закрывает окно возврата так же, как клик по затемнению
  useEffect(() => {
    if (!returning) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeReturn();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [returning]);

  // Возврат в работу: статус «В процессе» и причина отдельным комментарием
  const handleReturn = async () => {
    const reason = returnReason.trim();
    if (!reason || !returning) return;
    setReturningBusy(true);
    try {
      await apiFetch(`/tasks/${returning.id}`, { method: 'PUT', body: { status: 'in-progress' } });
      await apiFetch(`/tasks/${returning.id}/comments`, {
        method: 'POST',
        body: { text: reason, kind: 'return' },
      });
      notify(t('toast.taskReturned'), 'success');
      closeReturn();
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setReturningBusy(false);
    }
  };

  // Удаление подтверждается модальным окном, а не системным диалогом браузера
  const removeTask = async (id) => {
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      notify(t('toast.deleted'), 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const confirmDelete = () => {
    const task = pendingDelete;
    setPendingDelete(null);
    if (task) removeTask(task.id);
  };

  return (
    <div
      className="container-card archive"
      role="tabpanel"
      id="tasks-panel-archive"
      aria-labelledby="tasks-tab-archive"
    >
      <div className="component-header archive__header">
        <TasksTabs active={tab} onChange={onTabChange} />
        <TaskFilter value={filter} onChange={onFilterChange} showStatus={false} />
      </div>

      {visibleTasks.length === 0 ? (
        <div className="tasks__empty">{query ? t('common.searchEmpty') : t('archive.empty')}</div>
      ) : (
        <div className="archive__list">
          {visibleTasks.map((task) => {
            const comments = task.comments || [];
            const draft = getDraft(task.id);
            const subtasks = subtasksByParent[task.id] || [];
            return (
              <div className="archive-card" key={task.id}>
                <div className="archive-card__top">
                  <div className="archive-card__heading">
                    <h3 className="archive-card__title">{task.name}</h3>
                    <div className="archive-card__meta">
                      <span className="tasks__status tasks__status--done">{t('status.done')}</span>
                      {task.groupName ? (
                        <span className="archive-card__meta-item">{task.groupName}</span>
                      ) : null}
                      {task.deadline ? (
                        <span className="archive-card__meta-item">
                          {t('tasks.col.deadline')}: {formatDate(task.deadline)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="archive-card__actions">
                    <button
                      type="button"
                      className="tasks__icon-btn tasks__icon-btn--return"
                      onClick={() => setReturning(task)}
                      aria-label={t('archive.return')}
                      title={t('archive.return')}
                    >
                      <AppIcon name="action.return" fallback={<ReturnIcon />} />
                    </button>
                    <button
                      type="button"
                      className="tasks__icon-btn tasks__icon-btn--danger"
                      onClick={() => setPendingDelete(task)}
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                    >
                      <AppIcon name="action.delete" fallback={<DeleteIcon />} />
                    </button>
                  </div>
                </div>

                {task.description ? (
                  <p className="archive-card__description">{task.description}</p>
                ) : null}

                {/* Результат, записанный при завершении задачи */}
                {task.result ? (
                  <>
                    <div className="archive-card__label">{t('tasks.result')}</div>
                    <p className="archive-card__result">{task.result}</p>
                  </>
                ) : null}

                {subtasks.length > 0 ? (
                  <>
                    <div className="archive-card__label">{t('tasks.subtasks')}</div>
                    <ul className="archive-subtasks">
                      {subtasks.map((subtask) => (
                        <li className="archive-subtask" key={subtask.id}>
                          <span className="archive-subtask__check" aria-hidden="true">
                            ✓
                          </span>
                          <span>{subtask.name}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                <div className="archive-card__label">{t('archive.comments')}</div>
                {comments.length > 0 ? (
                  <ul className="archive-comments">
                    {comments.map((comment) => (
                      <li className="archive-comment" key={comment.id}>
                        <p className="archive-comment__text">{comment.text}</p>
                        <span className="archive-comment__date">{formatDate(comment.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="archive-comments__empty">{t('archive.noComments')}</p>
                )}

                <label className="archive-card__label" htmlFor={`archive-comment-${task.id}`}>
                  {t('archive.addComment')}
                </label>
                <textarea
                  id={`archive-comment-${task.id}`}
                  className="archive-card__comment"
                  value={draft}
                  onChange={(e) => handleDraftChange(task.id, e.target.value)}
                  placeholder={t('archive.commentPlaceholder')}
                  rows={2}
                />
                <button
                  type="button"
                  className="btn-primary archive-card__save"
                  onClick={() => handleAddComment(task)}
                  disabled={!draft.trim() || savingId === task.id}
                >
                  {savingId === task.id ? '...' : t('archive.addComment')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {returning ? (
        <div className="modal-overlay" onClick={closeReturn}>
          <div
            className="modal return-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <h3 id="return-dialog-title">{t('archive.returnTitle')}</h3>
              <button
                type="button"
                className="modal__close"
                onClick={closeReturn}
                aria-label={t('common.cancel')}
              >
                &times;
              </button>
            </div>
            <div className="modal__body">
              <p className="return-dialog__task">{returning.name}</p>
              <label className="return-dialog__label" htmlFor="return-reason">
                {t('archive.returnReason')} *
              </label>
              <textarea
                id="return-reason"
                className="return-dialog__input"
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder={t('archive.returnReasonPlaceholder')}
                rows={3}
                autoFocus
              />
            </div>
            <div className="modal__footer">
              <button type="button" className="btn-secondary" onClick={closeReturn}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleReturn}
                disabled={!returnReason.trim() || returningBusy}
              >
                {returningBusy ? '...' : t('archive.returnSubmit')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('confirm.deleteTaskTitle')}
        message={pendingDelete ? `${pendingDelete.name}\n${t('confirm.deleteText')}` : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Archive;

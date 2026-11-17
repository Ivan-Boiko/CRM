import React, { useEffect, useState } from "react";
import './common.css';
import './TaskTable.css';
import { apiFetch } from '../api';
import { EditIcon, DeleteIcon } from './ActionIcons';
import TasksTabs from './TasksTabs';
import TaskFilter from './TaskFilter';
import StatusSelect from './StatusSelect';
import Select from './Select';
import DatePicker from './DatePicker';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_TASK = {
  name: '',
  description: '',
  priority: 'medium',
  deadline: '',
  deadline_time: '',
  status: 'todo',
  group_id: '',
};

const TaskTable = ({
  tasks,
  groups = [],
  onGroupsChanged,
  onRefresh,
  emptyText,
  tab,
  onTabChange,
  filter,
  onFilterChange,
  focusTaskId,
  onFocusHandled,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_TASK);
  // Задача, ожидающая подтверждения удаления
  const [pendingDelete, setPendingDelete] = useState(null);
  // Черновик комментария в окне просмотра задачи
  const [commentDraft, setCommentDraft] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  // Свёрнутые подгруппы в списке задач
  const [collapsedGroups, setCollapsedGroups] = useState({});
  // Создание новой подгруппы прямо из формы задачи
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  // Подгруппа, ожидающая подтверждения удаления
  const [pendingGroupDelete, setPendingGroupDelete] = useState(false);
  const { notify } = useToast();
  const { t, formatDate } = useLanguage();

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_TASK);
    setIsNewGroupOpen(false);
    setNewGroupName('');
    setIsModalOpen(true);
  };

  const openView = (task) => {
    setViewingTask(task);
    setCommentDraft('');
    setIsViewOpen(true);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setViewingTask(null);
    setCommentDraft('');
  };

  // Переход из колокольчика: открываем карточку задачи по id
  useEffect(() => {
    if (!focusTaskId) return;
    const task = tasks.find((item) => item.id === focusTaskId);
    if (task) {
      setViewingTask(task);
      setCommentDraft('');
      setIsViewOpen(true);
    }
    onFocusHandled?.();
  }, [focusTaskId, tasks, onFocusHandled]);

  // Комментарии можно оставлять и у активной задачи — прямо в окне просмотра
  const handleAddComment = async () => {
    const text = commentDraft.trim();
    if (!text || !viewingTask) return;
    setSavingComment(true);
    try {
      const comment = await apiFetch(`/tasks/${viewingTask.id}/comments`, {
        method: 'POST',
        body: { text },
      });
      // Сразу показываем новый комментарий в открытом окне
      setViewingTask((prev) =>
        prev ? { ...prev, comments: [...(prev.comments || []), comment] } : prev
      );
      setCommentDraft('');
      notify(t('toast.commentAdded'), 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingComment(false);
    }
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setForm({
      name: task.name || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      deadline: task.deadline || '',
      deadline_time: task.deadline_time || '',
      status: task.status || 'todo',
      group_id: task.group_id || '',
    });
    setIsNewGroupOpen(false);
    setNewGroupName('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    // Пустое значение — «без подгруппы»
    const payload = {
      ...form,
      group_id: form.group_id === '' || form.group_id === null ? null : Number(form.group_id),
    };
    try {
      if (editingId) {
        await apiFetch(`/tasks/${editingId}`, { method: 'PUT', body: payload });
        notify(t('toast.taskUpdated'), 'success');
      } else {
        await apiFetch('/tasks', { method: 'POST', body: payload });
        notify(t('toast.taskAdded'), 'success');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Новая подгруппа создаётся прямо из формы задачи и сразу выбирается
  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    try {
      const group = await apiFetch('/task-groups', { method: 'POST', body: { name } });
      setForm((prev) => ({ ...prev, group_id: group.id }));
      setNewGroupName('');
      setIsNewGroupOpen(false);
      notify(t('toast.groupAdded'), 'success');
      onGroupsChanged?.();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Удаление подгруппы: задачи из неё остаются и попадают в «Без подгруппы»
  const handleDeleteGroup = async () => {
    const group = groups.find((item) => String(item.id) === String(form.group_id));
    setPendingGroupDelete(false);
    if (!group) return;
    try {
      await apiFetch(`/task-groups/${group.id}`, { method: 'DELETE' });
      setForm((prev) => ({ ...prev, group_id: '' }));
      notify(t('toast.groupDeleted'), 'success');
      onGroupsChanged?.();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Статус можно менять прямо в строке, не открывая редактирование
  const handleStatusChange = async (task, status) => {
    if (status === task.status) return;
    try {
      await apiFetch(`/tasks/${task.id}`, { method: 'PUT', body: { status } });
      notify(t('toast.statusUpdated'), 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
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

  const getPriorityLabel = (priority) => t(`priority.${priority}`);
  const getStatusLabel = (status) => t(`status.${status}`);

  // Секции списка: подгруппы в порядке каталога, задачи без подгруппы — в конце
  const groupSections = (() => {
    const sections = groups
      .map((group) => ({
        key: `group-${group.id}`,
        title: group.name,
        tasks: tasks.filter((task) => task.group_id === group.id),
      }))
      .filter((section) => section.tasks.length > 0);

    const knownIds = new Set(groups.map((group) => group.id));
    const ungrouped = tasks.filter((task) => !knownIds.has(task.group_id));
    if (ungrouped.length > 0) {
      sections.push({ key: 'no-group', title: t('tasks.groupNone'), tasks: ungrouped });
    }
    return sections;
  })();

  return (
    <div
      className="container-card tasks"
      role="tabpanel"
      id="tasks-panel-active"
      aria-labelledby="tasks-tab-active"
    >
      <div className="component-header tasks__header">
        <TasksTabs active={tab} onChange={onTabChange} />
        <div className="tasks__header-right">
          <TaskFilter value={filter} onChange={onFilterChange} />
        </div>
      </div>

      <div className="tasks__container">
        {tasks.length === 0 ? (
          <div className="tasks__empty">{emptyText || t('tasks.empty')}</div>
        ) : (
          <div className="tasks__table">
            <div className="tasks__row tasks__row--header">
              <div className="tasks__cell tasks__cell--header tasks__cell--name">{t('tasks.col.name')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.priority')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.deadline')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.status')}</div>
            </div>

            {groupSections.map((section) => (
              <div className="tasks__group" key={section.key}>
                <button
                  type="button"
                  className="tasks__group-header"
                  onClick={() => toggleGroup(section.key)}
                  aria-expanded={!collapsedGroups[section.key]}
                >
                  <span
                    className={`tasks__group-chevron${collapsedGroups[section.key] ? ' tasks__group-chevron--collapsed' : ''}`}
                    aria-hidden="true"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                  <span className="tasks__group-title">{section.title}</span>
                  <span className="tasks__group-count">{section.tasks.length}</span>
                </button>

                {!collapsedGroups[section.key] &&
                  section.tasks.map((task) => (
              <div
                key={task.id}
                className="tasks__row"
                onClick={() => openView(task)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openView(task);
                  }
                }}
              >
                <div className="tasks__cell tasks__cell--name">
                  <span className="tasks__cell-label">{t('tasks.col.name')}</span>
                  <span className="tasks__cell-name" title={task.name}>
                    {task.name}
                  </span>
                </div>
                <div className="tasks__cell">
                  <span className="tasks__cell-label">{t('tasks.col.priority')}</span>
                  <div className={`tasks__priority tasks__priority--${task.priority}`}>
                    {getPriorityLabel(task.priority)}
                  </div>
                </div>
                <div className="tasks__cell">
                  <span className="tasks__cell-label">{t('tasks.col.deadline')}</span>
                  <span>
                    {formatDate(task.deadline)}
                    {task.deadline_time ? `, ${task.deadline_time}` : ''}
                  </span>
                </div>
                <div className="tasks__cell" onClick={(e) => e.stopPropagation()}>
                  <span className="tasks__cell-label">{t('tasks.col.status')}</span>
                  <StatusSelect
                    value={task.status}
                    onChange={(status) => handleStatusChange(task, status)}
                    ariaLabel={t('tasks.col.status')}
                  />
                </div>
                <div className="tasks__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="tasks__icon-btn"
                    onClick={() => openEdit(task)}
                    aria-label={t('common.edit')}
                    title={t('common.edit')}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="tasks__icon-btn tasks__icon-btn--danger"
                    onClick={() => setPendingDelete(task)}
                    aria-label={t('common.delete')}
                    title={t('common.delete')}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tasks__footer">
        <button className="btn-primary" onClick={openAdd}>
          {t('tasks.add')}
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal tasks__modal">
            <div className="modal__header">
              <h3>{editingId ? t('tasks.modal.edit') : t('tasks.modal.add')}</h3>
              <button className="modal__close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="name">{t('tasks.col.name')} *</label>
                <input
                  type="text"
                  id="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder={t('tasks.field.namePlaceholder')}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">{t('tasks.field.description')}</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder={t('tasks.field.descriptionPlaceholder')}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">{t('tasks.col.priority')}</label>
                <Select
                  id="priority"
                  value={form.priority}
                  onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
                  options={[
                    { value: 'high', label: t('priority.high'), dotClass: 'select__dot--high' },
                    { value: 'medium', label: t('priority.medium'), dotClass: 'select__dot--medium' },
                    { value: 'low', label: t('priority.low'), dotClass: 'select__dot--low' },
                  ]}
                />
              </div>
              <div className="form-group">
                <label htmlFor="group_id">{t('tasks.group')}</label>
                <div className="task-group-field">
                  <Select
                    id="group_id"
                    value={form.group_id ?? ''}
                    onChange={(value) => setForm((prev) => ({ ...prev, group_id: value }))}
                    options={[
                      { value: '', label: t('tasks.groupNone') },
                      ...groups.map((group) => ({ value: group.id, label: group.name })),
                    ]}
                  />
                  <button
                    type="button"
                    className="btn-secondary task-group-field__add"
                    onClick={() => setIsNewGroupOpen((prev) => !prev)}
                  >
                    {t('tasks.groupAdd')}
                  </button>
                  <button
                    type="button"
                    className="tasks__icon-btn tasks__icon-btn--danger"
                    onClick={() => setPendingGroupDelete(true)}
                    disabled={!form.group_id}
                    aria-label={t('tasks.groupDelete')}
                    title={t('tasks.groupDelete')}
                  >
                    <DeleteIcon />
                  </button>
                </div>
                {isNewGroupOpen && (
                  <div className="task-group-new">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder={t('tasks.groupPlaceholder')}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim()}
                    >
                      {t('common.add')}
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="deadline">{t('tasks.col.deadline')}</label>
                <DatePicker
                  id="deadline"
                  value={form.deadline}
                  onChange={(value) => setForm((prev) => ({ ...prev, deadline: value }))}
                  ariaLabel={t('tasks.col.deadline')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="deadline_time">{t('tasks.field.deadlineTime')}</label>
                <input
                  id="deadline_time"
                  type="time"
                  value={form.deadline_time}
                  onChange={(e) => setForm((prev) => ({ ...prev, deadline_time: e.target.value }))}
                  disabled={!form.deadline}
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">{t('tasks.col.status')}</label>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                  options={[
                    { value: 'todo', label: t('status.todo'), dotClass: 'select__dot--todo' },
                    { value: 'in-progress', label: t('status.in-progress'), dotClass: 'select__dot--in-progress' },
                    { value: 'done', label: t('status.done'), dotClass: 'select__dot--done' },
                  ]}
                />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn-secondary modal__cancel" onClick={() => setIsModalOpen(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn-primary modal__submit" onClick={handleSubmit}>
                {editingId ? t('common.save') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isViewOpen && viewingTask && (
        <div className="modal-overlay" onClick={closeView}>
          <div className="modal tasks__modal tasks__view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{viewingTask.name}</h3>
              <button className="modal__close" onClick={closeView}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              {viewingTask.description ? (
                <div className="tasks__view-section">
                  <div className="tasks__view-label">{t('tasks.field.description')}</div>
                  <div className="tasks__view-description">{viewingTask.description}</div>
                </div>
              ) : null}
              <div className="tasks__view-grid">
                <div className="tasks__view-item">
                  <div className="tasks__view-label">{t('tasks.col.priority')}</div>
                  <div className={`tasks__priority tasks__priority--${viewingTask.priority}`}>
                    {getPriorityLabel(viewingTask.priority)}
                  </div>
                </div>
                <div className="tasks__view-item">
                  <div className="tasks__view-label">{t('tasks.col.status')}</div>
                  <div className={`tasks__status tasks__status--${viewingTask.status}`}>
                    {getStatusLabel(viewingTask.status)}
                  </div>
                </div>
                <div className="tasks__view-item">
                  <div className="tasks__view-label">{t('tasks.col.deadline')}</div>
                  <div>
                    {formatDate(viewingTask.deadline)}
                    {viewingTask.deadline_time ? `, ${viewingTask.deadline_time}` : ''}
                  </div>
                </div>
                <div className="tasks__view-item">
                  <div className="tasks__view-label">{t('tasks.group')}</div>
                  <div>{viewingTask.groupName || t('tasks.groupNone')}</div>
                </div>
              </div>

              <div className="tasks__view-section">
                <div className="tasks__view-label">{t('tasks.comments')}</div>
                {viewingTask.comments?.length ? (
                  <ul className="tasks__view-comments">
                    {viewingTask.comments.map((comment) => (
                      <li
                        key={comment.id}
                        className={`tasks__view-comment${comment.kind === 'return' ? ' tasks__view-comment--return' : ''}`}
                      >
                        {comment.kind === 'return' ? (
                          <span className="tasks__view-comment-badge">{t('tasks.returnReasonLabel')}</span>
                        ) : null}
                        <p className="tasks__view-comment-text">{comment.text}</p>
                        <span className="tasks__view-comment-date">{formatDate(comment.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tasks__view-comments-empty">{t('archive.noComments')}</p>
                )}

                <label className="tasks__view-comment-label" htmlFor={`task-comment-${viewingTask.id}`}>
                  {t('tasks.addComment')}
                </label>
                <textarea
                  id={`task-comment-${viewingTask.id}`}
                  className="tasks__view-comment-input"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={t('archive.commentPlaceholder')}
                  rows={2}
                />
                <button
                  type="button"
                  className="btn-primary tasks__view-comment-submit"
                  onClick={handleAddComment}
                  disabled={!commentDraft.trim() || savingComment}
                >
                  {savingComment ? '...' : t('tasks.addComment')}
                </button>
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="btn-secondary modal__cancel"
                onClick={() => {
                  closeView();
                  openEdit(viewingTask);
                }}
              >
                {t('common.edit')}
              </button>
              <button className="btn-primary modal__submit" onClick={closeView}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingGroupDelete && Boolean(form.group_id)}
        title={t('confirm.deleteGroupTitle')}
        message={`${groups.find((group) => String(group.id) === String(form.group_id))?.name || ''}\n${t('confirm.deleteGroupText')}`}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteGroup}
        onCancel={() => setPendingGroupDelete(false)}
      />

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

export default TaskTable;

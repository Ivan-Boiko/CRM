import React, { useState } from "react";
import './common.css';
import './TaskTable.css';
import { apiFetch } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_TASK = {
  name: '',
  description: '',
  priority: 'medium',
  assigned: '',
  deadline: '',
  status: 'todo',
};

const TaskTable = ({ tasks, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_TASK);
  const { notify } = useToast();
  const { t, formatDate } = useLanguage();

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_TASK);
    setIsModalOpen(true);
  };

  const openView = (task) => {
    setViewingTask(task);
    setIsViewOpen(true);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setViewingTask(null);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setForm({
      name: task.name || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      assigned: task.assigned || '',
      deadline: task.deadline || '',
      status: task.status || 'todo',
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await apiFetch(`/tasks/${editingId}`, { method: 'PUT', body: form });
        notify(t('toast.taskUpdated'), 'success');
      } else {
        await apiFetch('/tasks', { method: 'POST', body: form });
        notify(t('toast.taskAdded'), 'success');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.delete') + '?')) return;
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      notify(t('toast.deleted'), 'success');
      onRefresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const getPriorityLabel = (priority) => t(`priority.${priority}`);
  const getStatusLabel = (status) => t(`status.${status}`);

  return (
    <div className="container-card tasks">
      <div className="component-header">
        <h2 className="component-title">{t('tasks.title')}</h2>
        <button className="btn-primary" onClick={openAdd}>
          {t('tasks.add')}
        </button>
      </div>

      <div className="tasks__container">
        {tasks.length === 0 ? (
          <div className="tasks__empty">{t('tasks.empty')}</div>
        ) : (
          <div className="tasks__table">
            <div className="tasks__row tasks__row--header">
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.name')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.priority')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.assigned')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.deadline')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.status')}</div>
              <div className="tasks__cell tasks__cell--header">{t('tasks.col.actions')}</div>
            </div>

            {tasks.map((task) => (
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
                  <span className="tasks__cell-name">{task.name}</span>
                </div>
                <div className="tasks__cell">
                  <span className="tasks__cell-label">{t('tasks.col.priority')}</span>
                  <div className={`tasks__priority tasks__priority--${task.priority}`}>
                    {getPriorityLabel(task.priority)}
                  </div>
                </div>
                <div className="tasks__cell">
                  <span className="tasks__cell-label">{t('tasks.col.assigned')}</span>
                  <span>{task.assigned}</span>
                </div>
                <div className="tasks__cell">
                  <span className="tasks__cell-label">{t('tasks.col.deadline')}</span>
                  <span>{formatDate(task.deadline)}</span>
                </div>
                <div className="tasks__cell">
                  <span className="tasks__cell-label">{t('tasks.col.status')}</span>
                  <div className={`tasks__status tasks__status--${task.status}`}>
                    {getStatusLabel(task.status)}
                  </div>
                </div>
                <div className="tasks__cell tasks__cell--actions" onClick={(e) => e.stopPropagation()}>
                  <button className="tasks__action-btn" onClick={() => openEdit(task)}>
                    {t('common.edit')}
                  </button>
                  <button
                    className="tasks__action-btn tasks__action-btn--danger"
                    onClick={() => handleDelete(task.id)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
                <select id="priority" className="form-select" value={form.priority} onChange={handleInputChange}>
                  <option value="high">{t('priority.high')}</option>
                  <option value="medium">{t('priority.medium')}</option>
                  <option value="low">{t('priority.low')}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="assigned">{t('tasks.col.assigned')}</label>
                <input
                  type="text"
                  id="assigned"
                  value={form.assigned}
                  onChange={handleInputChange}
                  placeholder={t('tasks.field.assignedPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="deadline">{t('tasks.col.deadline')}</label>
                <input
                  type="date"
                  id="deadline"
                  value={form.deadline}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">{t('tasks.col.status')}</label>
                <select id="status" className="form-select" value={form.status} onChange={handleInputChange}>
                  <option value="todo">{t('status.todo')}</option>
                  <option value="in-progress">{t('status.in-progress')}</option>
                  <option value="done">{t('status.done')}</option>
                </select>
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
                  <div className="tasks__view-label">{t('tasks.col.assigned')}</div>
                  <div>{viewingTask.assigned || '—'}</div>
                </div>
                <div className="tasks__view-item">
                  <div className="tasks__view-label">{t('tasks.col.deadline')}</div>
                  <div>{formatDate(viewingTask.deadline)}</div>
                </div>
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
    </div>
  );
};

export default TaskTable;

import React, { useEffect, useMemo, useRef, useState } from "react";
import './common.css';
import './TaskTable.css';
import { apiFetch } from '../api';
import { EditIcon, DeleteIcon } from './ActionIcons';
import AppIcon from './AppIcon';
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
  parent_id: '',
};

// Долгое нажатие/удержание мыши, после которого задачу можно перетащить
const LONG_PRESS_MS = 400;
// Смещение до срабатывания удержания: на телефоне палец дрожит,
// поэтому маленький сдвиг не должен отменять перетаскивание
const DRAG_CANCEL_PX = 20;

const TaskTable = ({
  tasks,
  allTasks = [],
  subtasksByParent = {},
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
  // Незаполненные обязательные поля: подсвечиваем их красным
  const [errors, setErrors] = useState({});
  // Развёрнутые подгруппы. Пустая карта значит, что все секции свёрнуты —
  // так список задач закрыт сразу после загрузки и обновления страницы
  const [expandedGroups, setExpandedGroups] = useState({});
  // Свёрнутые списки подзадач у конкретных основных задач
  const [collapsedSubtasks, setCollapsedSubtasks] = useState({});
  // Создание новой подгруппы прямо из формы задачи
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  // Подгруппа, ожидающая подтверждения удаления
  const [pendingGroupDelete, setPendingGroupDelete] = useState(false);
  // Перетаскивание: удерживаем строку и ведём на другую задачу
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  // Подзадача, которую отпускают на заголовке группы или на другой задаче,
  // снова становится самостоятельной
  const [dropIsDetach, setDropIsDetach] = useState(false);
  const [dropGroupKey, setDropGroupKey] = useState(null);
  const dragRef = useRef({
    taskId: null,
    targetId: null,
    active: false,
    detach: false,
    groupId: undefined,
    x: 0,
    y: 0,
  });
  const longPressRef = useRef(null);
  const suppressClickRef = useRef(false);
  const { notify } = useToast();
  const { t, formatDate } = useLanguage();

  // Все задачи, включая подзадачи: нужны для карточки и выбора основной задачи
  const allKnownTasks = useMemo(() => {
    const nested = Object.values(subtasksByParent).flat();
    return [...allTasks, ...nested];
  }, [allTasks, subtasksByParent]);

  // Актуальный список для обработчиков с окна — без переподписки на каждом рендере
  const allKnownRef = useRef(allKnownTasks);
  useEffect(() => {
    allKnownRef.current = allKnownTasks;
  }, [allKnownTasks]);

  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (longPressRef.current) clearTimeout(longPressRef.current);
    },
    []
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_TASK);
    setErrors({});
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

  // Переход из колокольчика: открываем карточку задачи по id (в т.ч. подзадачи)
  useEffect(() => {
    if (!focusTaskId) return;
    const task = allKnownRef.current.find((item) => item.id === focusTaskId);
    if (task) {
      setViewingTask(task);
      setCommentDraft('');
      setIsViewOpen(true);
    }
    onFocusHandled?.();
  }, [focusTaskId, onFocusHandled]);

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
      parent_id: task.parent_id || '',
    });
    setErrors({});
    setIsNewGroupOpen(false);
    setNewGroupName('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    // Пользователь начал заполнять поле — снимаем красную подсветку
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const handleSubmit = async () => {
    // Обязательное поле не заполнено — подсвечиваем его вместо молчаливого выхода
    if (!form.name.trim()) {
      setErrors({ name: t('tasks.field.nameRequired') });
      return;
    }
    setErrors({});

    // Дедлайн в прошлом не сохраняем: напоминания по нему уже не сработают.
    // Если дата не менялась (правим старую просроченную задачу) — пропускаем проверку
    if (form.deadline) {
      const original = editingId
        ? allKnownTasks.find((task) => task.id === editingId)
        : null;
      const unchanged =
        original &&
        form.deadline === (original.deadline || '') &&
        (form.deadline_time || '') === (original.deadline_time || '');
      const deadlineAt = new Date(`${form.deadline}T${form.deadline_time || '23:59'}:00`);
      if (!unchanged && !Number.isNaN(deadlineAt.getTime()) && deadlineAt.getTime() < Date.now()) {
        notify(t('tasks.deadlinePast'), 'error');
        return;
      }
    }

    // Пустые значения — «без подгруппы» и «без основной задачи»
    const payload = {
      ...form,
      group_id: form.group_id === '' || form.group_id === null ? null : Number(form.group_id),
      parent_id:
        form.parent_id === '' || form.parent_id === null ? null : Number(form.parent_id),
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
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubtasks = (taskId) => {
    setCollapsedSubtasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
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

  // --- Перетаскивание задач друг на друга ---

  const handleRowPointerDown = (event, task) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // Кнопки внутри строки (статус, действия) не запускают перетаскивание
    if (event.target.closest('button, a, input, textarea, select')) return;

    dragRef.current = {
      taskId: task.id,
      targetId: null,
      active: false,
      x: event.clientX,
      y: event.clientY,
    };
    cancelLongPress();
    longPressRef.current = setTimeout(() => {
      dragRef.current.active = true;
      setDraggingId(task.id);
    }, LONG_PRESS_MS);
  };

  const handleRowPointerMove = (event) => {
    const state = dragRef.current;
    if (!state.taskId || state.active) return;
    // Сдвиг до срабатывания удержания — это прокрутка или выбор, а не перетаскивание
    if (
      Math.abs(event.clientX - state.x) > DRAG_CANCEL_PX ||
      Math.abs(event.clientY - state.y) > DRAG_CANCEL_PX
    ) {
      cancelLongPress();
      state.taskId = null;
    }
  };

  const handleRowPointerEnd = () => {
    if (dragRef.current.active) return;
    cancelLongPress();
    dragRef.current.taskId = null;
  };

  useEffect(() => {
    if (!draggingId) return undefined;

    const handleMove = (event) => {
      // Пока тянем задачу, страница не должна прокручиваться
      if (event.cancelable) event.preventDefault();
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const row = element && element.closest('[data-task-id]');
      const groupHeader = element && element.closest('[data-group-key]');
      const targetId = row ? Number(row.getAttribute('data-task-id')) : null;
      const candidate = targetId
        ? allKnownRef.current.find((task) => task.id === targetId)
        : null;
      const draggingTask = allKnownRef.current.find((task) => task.id === draggingId);
      const isSubtask = Boolean(draggingTask && draggingTask.parent_id);

      // Бросок на себя ничего не меняет
      if (candidate && candidate.id === draggingId) {
        dragRef.current.targetId = null;
        dragRef.current.detach = false;
        dragRef.current.groupId = undefined;
        setDropTargetId(null);
        setDropIsDetach(false);
        setDropGroupKey(null);
        return;
      }

      if (isSubtask) {
        // 1. Заголовок группы — задача становится самостоятельной в этой группе
        if (groupHeader) {
          dragRef.current.targetId = null;
          dragRef.current.detach = true;
          dragRef.current.groupId = groupHeader.getAttribute('data-group-id') || '';
          setDropTargetId(null);
          setDropIsDetach(true);
          setDropGroupKey(groupHeader.getAttribute('data-group-key'));
          return;
        }

        // 2. Другая задача — подзадача переходит к её основной задаче
        if (candidate) {
          const parentId = candidate.parent_id || candidate.id;
          if (parentId !== draggingTask.parent_id) {
            dragRef.current.targetId = parentId;
            dragRef.current.detach = false;
            dragRef.current.groupId = undefined;
            setDropTargetId(candidate.id);
            setDropIsDetach(false);
            setDropGroupKey(null);
            return;
          }
          // Уже подзадача этой задачи — ничего не делаем
          dragRef.current.targetId = null;
          dragRef.current.detach = false;
          dragRef.current.groupId = undefined;
          setDropTargetId(null);
          setDropIsDetach(false);
          setDropGroupKey(null);
          return;
        }

        // 3. Вне строк задач (пустая зона, подвал, страница) — самостоятельной
        dragRef.current.targetId = null;
        dragRef.current.detach = true;
        dragRef.current.groupId = undefined;
        setDropTargetId(null);
        setDropIsDetach(true);
        setDropGroupKey(null);
        return;
      }

      // Основную задачу можно вложить в любую другую основную (или в подзадачу —
      // тогда она станет подзадачей той же основной)
      let valid = null;
      if (candidate) {
        const parentId = candidate.parent_id || candidate.id;
        if (parentId !== draggingId) valid = parentId;
      }
      dragRef.current.targetId = valid;
      dragRef.current.detach = false;
      dragRef.current.groupId = undefined;
      setDropIsDetach(false);
      setDropGroupKey(null);
      setDropTargetId(valid ? targetId : null);
    };

    const finish = async () => {
      const state = dragRef.current;
      const wasActive = state.active;
      const { taskId, targetId, detach, groupId } = state;
      dragRef.current = {
        taskId: null,
        targetId: null,
        active: false,
        detach: false,
        groupId: undefined,
        x: 0,
        y: 0,
      };
      cancelLongPress();
      setDraggingId(null);
      setDropTargetId(null);
      setDropIsDetach(false);
      setDropGroupKey(null);

      if (!wasActive) return;
      // После удержания клик не должен открывать карточку задачи
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 300);
      if (!taskId) return;

      try {
        if (detach) {
          const body = { parent_id: null };
          // Бросок на заголовок группы ещё и переносит задачу в эту группу
          if (groupId !== undefined) body.group_id = groupId || null;
          await apiFetch(`/tasks/${taskId}`, { method: 'PUT', body });
          notify(t('toast.subtaskRemoved'), 'success');
          onRefresh();
          return;
        }
        if (!targetId) return;
        await apiFetch(`/tasks/${taskId}`, {
          method: 'PUT',
          body: { parent_id: targetId },
        });
        notify(t('toast.subtaskAdded'), 'success');
        onRefresh();
      } catch (err) {
        notify(err.message, 'error');
      }
    };

    // Пока тянем, страница не должна прокручиваться и выделять текст —
    // иначе браузер присылает pointercancel и перетаскивание обрывается
    document.body.classList.add('tasks-dragging');
    const preventTouchScroll = (event) => {
      if (event.cancelable) event.preventDefault();
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      document.body.classList.remove('tasks-dragging');
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('touchmove', preventTouchScroll);
    };
  }, [draggingId, notify, t, onRefresh]);

  // У старых задач приоритет мог не сохраниться — не показываем «priority.null»
  const getPriorityLabel = (priority) => t(`priority.${priority || 'medium'}`);
  const getStatusLabel = (status) => t(`status.${status}`);

  // Секции списка: подгруппы в порядке каталога, задачи без подгруппы — в конце
  const groupSections = (() => {
    const sections = groups
      .map((group) => ({
        key: `group-${group.id}`,
        groupId: group.id,
        title: group.name,
        tasks: tasks.filter((task) => task.group_id === group.id),
      }))
      .filter((section) => section.tasks.length > 0);

    const knownIds = new Set(groups.map((group) => group.id));
    const ungrouped = tasks.filter((task) => !knownIds.has(task.group_id));
    if (ungrouped.length > 0) {
      sections.push({
        key: 'no-group',
        groupId: null,
        title: t('tasks.groupNone'),
        tasks: ungrouped,
      });
    }
    return sections;
  })();

  // Основная задача, к которой относится открытая подзадача
  const viewingParent =
    viewingTask && viewingTask.parent_id
      ? allKnownTasks.find((task) => task.id === viewingTask.parent_id)
      : null;

  // Строка задачи и её подзадачи сразу под ней
  const renderTaskRow = (task, isSubtask = false, isLastSubtask = false) => {
    const children = subtasksByParent[task.id] || [];
    // Основная задача выполнена, но подзадачи ещё нет — в архив рано
    const waiting =
      !isSubtask && task.status === 'done' && children.some((child) => child.status !== 'done');
    const hasChildren = !isSubtask && children.length > 0;
    const subtasksCollapsed = hasChildren && Boolean(collapsedSubtasks[task.id]);

    return (
      <React.Fragment key={task.id}>
        <div
          className={[
            'tasks__row',
            isSubtask ? 'tasks__row--subtask' : '',
            isSubtask && isLastSubtask ? 'tasks__row--subtask-last' : '',
            draggingId === task.id ? 'tasks__row--dragging' : '',
            dropTargetId === task.id ? 'tasks__row--drop-target' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-task-id={task.id}
          onClick={() => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              return;
            }
            openView(task);
          }}
          onPointerDown={(event) => handleRowPointerDown(event, task)}
          onPointerMove={handleRowPointerMove}
          onPointerUp={handleRowPointerEnd}
          onPointerCancel={handleRowPointerEnd}
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
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
            {isSubtask ? (
              <span className="tasks__subtask-mark" aria-hidden="true">
                ↳
              </span>
            ) : null}
            <span className="tasks__cell-name" title={task.name}>
              {task.name}
            </span>
            {hasChildren ? (
              <button
                type="button"
                className={`tasks__subtasks-toggle${
                  subtasksCollapsed ? ' tasks__subtasks-toggle--collapsed' : ''
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSubtasks(task.id);
                }}
                aria-expanded={!subtasksCollapsed}
                aria-label={t(
                  subtasksCollapsed ? 'tasks.expandSubtasks' : 'tasks.collapseSubtasks'
                )}
                title={t(subtasksCollapsed ? 'tasks.expandSubtasks' : 'tasks.collapseSubtasks')}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="tasks__subtasks-count">{children.length}</span>
              </button>
            ) : null}
            {waiting ? <span className="tasks__waiting">{t('tasks.waitingSubtasks')}</span> : null}
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
              <AppIcon name="action.edit" fallback={<EditIcon />} />
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

        {!isSubtask &&
          !subtasksCollapsed &&
          children.map((child, index) =>
            renderTaskRow(child, true, index === children.length - 1)
          )}
      </React.Fragment>
    );
  };

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
            {groupSections.map((section) => (
              <div className="tasks__group" key={section.key}>
                <button
                  type="button"
                  // Заголовок группы — тоже цель для подзадачи: брошенная сюда,
                  // она снова становится самостоятельной задачей этой группы
                  data-group-key={section.key}
                  data-group-id={section.groupId ?? ''}
                  className={`tasks__group-header${
                    dropGroupKey === section.key ? ' tasks__group-header--drop' : ''
                  }`}
                  onClick={() => toggleGroup(section.key)}
                  aria-expanded={Boolean(expandedGroups[section.key])}
                >
                  <span
                    className={`tasks__group-chevron${expandedGroups[section.key] ? '' : ' tasks__group-chevron--collapsed'}`}
                    aria-hidden="true"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                  <span className="tasks__group-title">{section.title}</span>
                  <span className="tasks__group-count">{section.tasks.length}</span>
                </button>

                {expandedGroups[section.key] && (
                  <>
                    {/* Шапка колонок повторяется внутри каждой группы */}
                    <div className="tasks__row tasks__row--header">
                      <div className="tasks__cell tasks__cell--header tasks__cell--name">
                        {t('tasks.col.name')}
                      </div>
                      <div className="tasks__cell tasks__cell--header">{t('tasks.col.priority')}</div>
                      <div className="tasks__cell tasks__cell--header">{t('tasks.col.deadline')}</div>
                      <div className="tasks__cell tasks__cell--header">{t('tasks.col.status')}</div>
                    </div>
                    {section.tasks.map((task) => renderTaskRow(task))}
                  </>
                )}
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
      <p className="tasks__drag-hint">{t('tasks.dragHint')}</p>
      {/* Подсказка появляется, когда подзадачу отпустят вне строки задачи */}
      {dropIsDetach ? <div className="tasks__detach-hint">{t('tasks.detachHint')}</div> : null}

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
                  className={errors.name ? 'form-input--error' : undefined}
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder={t('tasks.field.namePlaceholder')}
                  aria-invalid={Boolean(errors.name)}
                  required
                />
                {errors.name ? <p className="form-group__error">{errors.name}</p> : null}
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
                    <AppIcon name="action.delete" fallback={<DeleteIcon />} />
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
                <label htmlFor="parent_id">{t('tasks.parent')}</label>
                <Select
                  id="parent_id"
                  value={form.parent_id ?? ''}
                  onChange={(value) => setForm((prev) => ({ ...prev, parent_id: value }))}
                  options={[
                    { value: '', label: t('tasks.parentNone') },
                    ...allTasks
                      .filter((task) => task.id !== editingId)
                      .map((task) => ({ value: task.id, label: task.name })),
                  ]}
                />
                <p className="tasks__field-hint">{t('tasks.parentHint')}</p>
              </div>
              <div className="form-group">
                <label htmlFor="deadline">{t('tasks.col.deadline')}</label>
                <DatePicker
                  id="deadline"
                  value={form.deadline}
                  time={form.deadline_time}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      deadline: value,
                      // Без даты время не нужно
                      deadline_time: value ? prev.deadline_time : '',
                    }))
                  }
                  onTimeChange={(value) => setForm((prev) => ({ ...prev, deadline_time: value }))}
                  ariaLabel={t('tasks.col.deadline')}
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
                {viewingParent ? (
                  <div className="tasks__view-item">
                    <div className="tasks__view-label">{t('tasks.parent')}</div>
                    <div>{viewingParent.name}</div>
                  </div>
                ) : null}
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
        message={
          pendingDelete
            ? `${pendingDelete.name}\n${
                (subtasksByParent[pendingDelete.id] || []).length
                  ? t('confirm.deleteParentText')
                  : t('confirm.deleteText')
              }`
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

export default TaskTable;

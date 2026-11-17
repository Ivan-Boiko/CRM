import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import Select from './Select';

// Варианты фильтра в порядке меню
export const TASK_FILTERS = ['deadline-desc', 'deadline-asc', 'priority', 'status'];

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER = { todo: 0, 'in-progress': 1, done: 2 };

const deadlineTime = (task) => (task.deadline ? new Date(task.deadline).getTime() : null);

// Задачи без дедлайна всегда в конце списка
const compareByDeadline = (a, b, direction) => {
  const aTime = deadlineTime(a);
  const bTime = deadlineTime(b);
  if (aTime === null && bTime === null) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;
  return direction === 'asc' ? aTime - bTime : bTime - aTime;
};

// Применяет выбранный фильтр к списку задач (сортировка на клиенте)
export function applyTaskFilter(tasks, filter) {
  const list = [...tasks];

  switch (filter) {
    case 'deadline-desc':
      return list.sort((a, b) => compareByDeadline(a, b, 'desc'));
    case 'deadline-asc':
      return list.sort((a, b) => compareByDeadline(a, b, 'asc'));
    case 'status':
      return list.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
    case 'priority':
    default:
      return list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
  }
}

// Селектор «Фильтровать по:». В архиве вариант «по статусам» не нужен — там все задачи выполнены.
const TaskFilter = ({ value, onChange, showStatus = true }) => {
  const { t } = useLanguage();
  const options = showStatus ? TASK_FILTERS : TASK_FILTERS.filter((option) => option !== 'status');

  return (
    <div className="task-filter">
      <label className="task-filter__label" htmlFor="task-filter">
        {t('tasks.filter.label')}
      </label>
      <Select
        id="task-filter"
        className="task-filter__select"
        value={value}
        onChange={onChange}
        ariaLabel={t('tasks.filter.label')}
        options={options.map((option) => ({ value: option, label: t(`tasks.filter.${option}`) }))}
      />
    </div>
  );
};

export default TaskFilter;

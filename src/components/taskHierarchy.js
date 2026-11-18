// Подзадачи: задача может быть вложена только в основную (один уровень),
// поэтому карта «основная задача → её подзадачи» строится по parent_id.
export const buildSubtaskMap = (tasks) => {
  const map = {};
  tasks.forEach((task) => {
    if (!task.parent_id) return;
    if (!map[task.parent_id]) map[task.parent_id] = [];
    map[task.parent_id].push(task);
  });
  return map;
};

// Есть ли у задачи незавершённые подзадачи
export const hasOpenSubtasks = (task, subtaskMap) =>
  (subtaskMap[task.id] || []).some((subtask) => subtask.status !== 'done');

// В архив задача попадает только когда выполнена сама и все её подзадачи выполнены.
// Выполненная основная задача с открытыми подзадачами остаётся в списке активных.
export const isArchivable = (task, subtaskMap) =>
  task.status === 'done' && !hasOpenSubtasks(task, subtaskMap);

// Задача завершена позже срока: сравниваем момент завершения с концом дня дедлайна.
// Без времени срок истекает в 23:59, как и при подсветке в списке задач.
export const isCompletedLate = (task) => {
  if (task.status !== 'done' || !task.completed_at || !task.deadline) return false;
  const end = new Date(`${task.deadline}T${task.deadline_time || '23:59'}:00`);
  if (Number.isNaN(end.getTime())) return false;
  return new Date(task.completed_at) > end;
};

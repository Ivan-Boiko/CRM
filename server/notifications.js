// Напоминания о дедлайнах: за 6 часов и за час до срока.
// Тик запускается раз в минуту и создаёт записи в notifications, которые
// показывает колокольчик в шапке. Внешние зависимости не нужны.
import db from './database.js';

// Если время у дедлайна не задано, считаем концом дня
export const DEFAULT_DEADLINE_TIME = '23:59';

const SIX_HOURS_MINUTES = 6 * 60;
const ONE_HOUR_MINUTES = 60;
// Уведомления старше этого срока не нужны — чистим, чтобы таблица не росла
const KEEP_DAYS = 90;

// Часовой пояс из настроек браузера; невалидный откатываем к Москве
export function isValidTimezone(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch (err) {
    return false;
  }
}

export function getUserTimezone(userId) {
  const row = db.prepare('SELECT timezone FROM users WHERE id = ?').get(userId);
  return isValidTimezone(row && row.timezone) ? row.timezone : 'Europe/Moscow';
}

// Прошёл ли дедлайн в поясе пользователя: та же шкала минут, что и у напоминаний
export function isDeadlineInPast(deadline, time, timezone) {
  const value = deadlineMinutes(deadline, time);
  if (value === null) return false;
  const now = localNow(isValidTimezone(timezone) ? timezone : 'Europe/Moscow');
  return value < localDateMinutes(now);
}

export function saveTimezone(userId, value) {
  if (!isValidTimezone(value)) return;
  db.prepare(
    "UPDATE users SET timezone = ? WHERE id = ? AND COALESCE(timezone, '') <> ?"
  ).run(value, userId, value);
}

// Текущие дата и минуты суток в поясе пользователя.
// Сравниваем «настенное» время дедлайна с «настенным» сейчас — так и нужно
// для напоминаний, а переход на летнее время на границе не критичен.
function localNow(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = {};
  formatter.formatToParts(new Date()).forEach((part) => {
    parts[part.type] = part.value;
  });
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(hour) * 60 + Number(parts.minute),
  };
}

// Дедлайн в минутах от эпохи: дата и время трактуются как местные для пользователя
function deadlineMinutes(deadline, time) {
  if (!deadline) return null;
  const [year, month, day] = String(deadline).slice(0, 10).split('-').map(Number);
  const [hours, minutes] = String(time || DEFAULT_DEADLINE_TIME).split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return Date.UTC(year, month - 1, day) / 60000 + hours * 60 + minutes;
}

const localDateMinutes = (now) => Date.UTC(
  Number(now.date.slice(0, 4)),
  Number(now.date.slice(5, 7)) - 1,
  Number(now.date.slice(8, 10))
) / 60000 + now.minutes;

// Какой порог сработал. Если задача появилась позже шести часов — придёт только «час»
function reminderKind(diffMinutes) {
  if (diffMinutes <= 0) return null;
  if (diffMinutes <= ONE_HOUR_MINUTES) return '1h';
  if (diffMinutes <= SIX_HOURS_MINUTES) return '6h';
  return null;
}

export function runReminderTick() {
  const users = db
    .prepare(
      `SELECT DISTINCT u.id, u.timezone
         FROM users u
         JOIN tasks t ON t.user_id = u.id
        WHERE t.status <> 'done' AND t.deadline IS NOT NULL`
    )
    .all();

  const insert = db.prepare(
    `INSERT OR IGNORE INTO notifications
       (user_id, task_id, kind, task_name, deadline, deadline_time, dedupe_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tasksForUser = db.prepare(
    `SELECT id, name, deadline, deadline_time
       FROM tasks
      WHERE user_id = ? AND status <> 'done' AND deadline IS NOT NULL`
  );

  let created = 0;
  const nowIso = new Date().toISOString();

  users.forEach((user) => {
    const timezone = isValidTimezone(user.timezone) ? user.timezone : 'Europe/Moscow';
    const now = localNow(timezone);
    const nowMinutes = localDateMinutes(now);

    tasksForUser.all(user.id).forEach((task) => {
      const deadlineValue = deadlineMinutes(task.deadline, task.deadline_time);
      if (deadlineValue === null) return;
      const kind = reminderKind(deadlineValue - nowMinutes);
      if (!kind) return;

      // Ключ включает дедлайн: если срок перенесли, напоминание придёт заново
      const dedupeKey = `${kind}:${task.id}:${task.deadline}T${task.deadline_time || DEFAULT_DEADLINE_TIME}`;
      const info = insert.run(
        user.id,
        task.id,
        kind,
        task.name,
        task.deadline,
        task.deadline_time || DEFAULT_DEADLINE_TIME,
        dedupeKey,
        nowIso
      );
      created += info.changes;
    });
  });

  // Старые записи чистим раз в тик: удаление по индексу created_at недорогое
  const keepFrom = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM notifications WHERE created_at < ?').run(keepFrom);

  return created;
}

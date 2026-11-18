import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, 'crm.db');

// Локальная БД в файле server/crm.db
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Добавляет колонку в таблицу, если её ещё нет
function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      priority TEXT,
      assigned TEXT,
      deadline TEXT,
      status TEXT,
      result TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT,
      date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER,
      kind TEXT NOT NULL,
      task_name TEXT NOT NULL,
      deadline TEXT,
      deadline_time TEXT,
      dedupe_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_icons (
      user_id INTEGER NOT NULL,
      icon_key TEXT NOT NULL,
      mime TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, icon_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      new_email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

  `);

  // Один и тот же порог по одной и той же задаче не должен срабатывать дважды
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
      ON notifications(user_id, dedupe_key);
    CREATE INDEX IF NOT EXISTS idx_notifications_user
      ON notifications(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_password_resets_user
      ON password_resets(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_change_user
      ON email_change_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_change_new_email
      ON email_change_requests(new_email);
  `);

  // Миграции для существующих баз
  addColumnIfMissing('tasks', 'description', 'TEXT');
  addColumnIfMissing('tasks', 'comment', 'TEXT');
  addColumnIfMissing('users', 'avatar', 'TEXT');
  // Привязка личного Telegram-бота: чат, имя, одноразовый код и срок его жизни
  addColumnIfMissing('users', 'telegram_chat_id', 'TEXT');
  addColumnIfMissing('users', 'telegram_username', 'TEXT');
  addColumnIfMissing('users', 'telegram_link_code', 'TEXT');
  addColumnIfMissing('users', 'telegram_link_expires', 'TEXT');
  addColumnIfMissing('users', 'telegram_linked_at', 'TEXT');
  // Время дедлайна: без него нельзя отсчитать 6 часов и час до срока
  addColumnIfMissing('tasks', 'deadline_time', 'TEXT');
  // Часовой пояс браузера (IANA): по нему сервер считает время напоминаний
  addColumnIfMissing('users', 'timezone', 'TEXT');
  // Вид комментария: обычный ('comment') или причина возврата задачи в работу ('return')
  addColumnIfMissing('task_comments', 'kind', "TEXT DEFAULT 'comment'");
  // Подгруппа задачи («Работа», «Личное» и свои)
  addColumnIfMissing('tasks', 'group_id', 'INTEGER');
  // Тема записи дневника: короткий заголовок над текстом
  addColumnIfMissing('diary', 'topic', 'TEXT');
  // Подзадача ссылается на основную задачу (один уровень вложенности)
  addColumnIfMissing('tasks', 'parent_id', 'INTEGER');
  // Результат выполненных действий: пишется при завершении задачи и виден в архиве
  addColumnIfMissing('tasks', 'result', 'TEXT');
  // Фактический момент завершения: по нему архив показывает просрочку, аналитика считает опоздания
  addColumnIfMissing('tasks', 'completed_at', 'TEXT');

  // Просроченные ссылки сброса пароля и подтверждения email не нужны
  const nowIso = new Date().toISOString();
  db.prepare('DELETE FROM password_resets WHERE expires_at < ?').run(nowIso);
  db.prepare('DELETE FROM email_change_requests WHERE expires_at < ?').run(nowIso);

  // Старый одиночный комментарий задачи переносим в таблицу комментариев
  const legacyComments = db
    .prepare("SELECT id, comment FROM tasks WHERE comment IS NOT NULL AND TRIM(comment) <> ''")
    .all();
  const hasComments = db.prepare('SELECT 1 FROM task_comments WHERE task_id = ? LIMIT 1');
  const insertComment = db.prepare(
    'INSERT INTO task_comments (task_id, text, created_at) VALUES (?, ?, ?)'
  );
  for (const task of legacyComments) {
    if (!hasComments.get(task.id)) {
      insertComment.run(task.id, task.comment.trim(), new Date().toISOString());
    }
  }

  // Лишние пробелы и переводы строк по краям комментариев убираем
  db.exec("UPDATE task_comments SET text = TRIM(text, char(32) || char(9) || char(10) || char(13))");
}

export default db;

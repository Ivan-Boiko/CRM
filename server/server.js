import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { initDb } from './database.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

initDb();

// --- Вспомогательные функции ---

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

// Проверка JWT: кладёт данные пользователя в req.user
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Сессия истекла, войдите заново' });
  }
}

// --- Аутентификация ---

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) {
    return res.status(409).json({ message: 'Такой email уже зарегистрирован' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
    .run(name, email, hash);
  const user = { id: info.lastInsertRowid, name, email, avatar: null };
  res.status(201).json({ token: signToken(user), user });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }
  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar || null },
  });
});

app.get('/api/me', auth, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, avatar FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
  res.json(user);
});

// Обновление профиля пользователя (имя, аватар)
app.put('/api/me', auth, (req, res) => {
  const { name, avatar } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined) {
    fields.push('name = ?');
    values.push(name);
  }
  if (avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(avatar);
  }
  if (fields.length === 0) {
    return res.status(400).json({ message: 'Нет полей для обновления' });
  }
  values.push(req.user.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const user = db
    .prepare('SELECT id, name, email, avatar FROM users WHERE id = ?')
    .get(req.user.id);
  res.json(user);
});

// --- Универсальный CRUD для пользовательских сущностей ---

function crud(route, table, fields, requiredField, decorateRow) {
  // Список записей текущего пользователя
  app.get(`/api/${route}`, auth, (req, res) => {
    const rows = db
      .prepare(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY id DESC`)
      .all(req.user.id);
    res.json(decorateRow ? rows.map(decorateRow) : rows);
  });

  // Создание записи
  app.post(`/api/${route}`, auth, (req, res) => {
    if (requiredField && !req.body[requiredField]) {
      return res.status(400).json({ message: `Поле «${requiredField}» обязательно` });
    }
    const cols = ['user_id', ...fields].join(', ');
    const placeholders = ['?', ...fields.map(() => '?')].join(', ');
    const values = fields.map((f) => req.body[f] ?? null);
    const info = db
      .prepare(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`)
      .run(req.user.id, ...values);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(row);
  });

  // Обновление записи
  app.put(`/api/${route}/:id`, auth, (req, res) => {
    const existing = db
      .prepare(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`)
      .get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ message: 'Запись не найдена' });

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    // Явно переданный null (например, сброс подгруппы) сохраняем, а не подменяем старым значением
    const values = fields.map((f) =>
      Object.prototype.hasOwnProperty.call(req.body, f) ? req.body[f] : existing[f]
    );
    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ? AND user_id = ?`).run(
      ...values,
      req.params.id,
      req.user.id
    );
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    res.json(row);
  });

  // Удаление записи
  app.delete(`/api/${route}/:id`, auth, (req, res) => {
    const info = db
      .prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`)
      .run(req.params.id, req.user.id);
    if (!info.changes) return res.status(404).json({ message: 'Запись не найдена' });
    res.json({ message: 'Удалено' });
  });
}

// --- Подгруппы задач ---

// Новому пользователю сразу создаём две базовые подгруппы
function ensureTaskGroups(userId) {
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM task_groups WHERE user_id = ?')
    .get(userId);
  if (count > 0) return;
  const insert = db.prepare('INSERT INTO task_groups (user_id, name, created_at) VALUES (?, ?, ?)');
  const now = new Date().toISOString();
  insert.run(userId, 'Работа', now);
  insert.run(userId, 'Личное', now);
}

const taskGroupNameStmt = db.prepare(
  'SELECT name FROM task_groups WHERE id = ? AND user_id = ?'
);

app.get('/api/task-groups', auth, (req, res) => {
  ensureTaskGroups(req.user.id);
  const groups = db
    .prepare('SELECT id, name FROM task_groups WHERE user_id = ? ORDER BY id ASC')
    .all(req.user.id);
  res.json(groups);
});

app.post('/api/task-groups', auth, (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Введите название подгруппы' });

  ensureTaskGroups(req.user.id);
  const exists = db
    .prepare('SELECT id FROM task_groups WHERE user_id = ? AND LOWER(name) = LOWER(?)')
    .get(req.user.id, name);
  if (exists) return res.status(409).json({ message: 'Такая подгруппа уже есть' });

  const info = db
    .prepare('INSERT INTO task_groups (user_id, name, created_at) VALUES (?, ?, ?)')
    .run(req.user.id, name, new Date().toISOString());
  res.status(201).json(
    db.prepare('SELECT id, name FROM task_groups WHERE id = ?').get(info.lastInsertRowid)
  );
});

app.delete('/api/task-groups/:id', auth, (req, res) => {
  const group = db
    .prepare('SELECT id FROM task_groups WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!group) return res.status(404).json({ message: 'Подгруппа не найдена' });

  // Задачи не удаляем — они просто остаются без подгруппы
  db.prepare('UPDATE tasks SET group_id = NULL WHERE group_id = ? AND user_id = ?').run(
    group.id,
    req.user.id
  );
  db.prepare('DELETE FROM task_groups WHERE id = ?').run(group.id);
  res.json({ message: 'Удалено' });
});

// Комментарии задачи хранятся отдельно: у задачи их может быть сколько угодно
const taskCommentsStmt = db.prepare(
  'SELECT id, text, COALESCE(kind, ?) AS kind, created_at AS createdAt FROM task_comments WHERE task_id = ? ORDER BY id ASC'
);
const DEFAULT_COMMENT_KIND = 'comment';
const withComments = (task) => ({
  ...task,
  comments: taskCommentsStmt.all('comment', task.id),
  groupName: task.group_id ? taskGroupNameStmt.get(task.group_id, task.user_id)?.name || null : null,
});

crud(
  'tasks',
  'tasks',
  ['name', 'description', 'priority', 'deadline', 'status', 'comment', 'group_id'],
  'name',
  withComments
);
crud('diary', 'diary', ['text', 'date'], 'text');

// Добавление комментария к задаче
app.post('/api/tasks/:id/comments', auth, (req, res) => {
  const task = db
    .prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ message: 'Задача не найдена' });

  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ message: 'Введите текст комментария' });

  // kind = 'return' — комментарий появился при возврате задачи из архива
  const kind = req.body.kind === 'return' ? 'return' : DEFAULT_COMMENT_KIND;
  const info = db
    .prepare('INSERT INTO task_comments (task_id, text, kind, created_at) VALUES (?, ?, ?, ?)')
    .run(task.id, text, kind, new Date().toISOString());
  const comment = db
    .prepare('SELECT id, text, COALESCE(kind, ?) AS kind, created_at AS createdAt FROM task_comments WHERE id = ?')
    .get(DEFAULT_COMMENT_KIND, info.lastInsertRowid);
  res.status(201).json(comment);
});

// --- Обработчик ошибок ---

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

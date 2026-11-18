// Первым делом читаем .env (локальный запуск): mailer.js и database.js
// берут переменные при импорте, поэтому загрузчик должен выполниться раньше них
import './env.js';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { initDb } from './database.js';
import {
  initTelegram,
  stopTelegram,
  getStatus,
  createLinkCode,
  unlink,
  sendMessage,
} from './telegram.js';
import {
  runReminderTick,
  saveTimezone,
  isDeadlineInPast,
  getUserTimezone,
} from './notifications.js';
import { isMailConfigured, sendMail } from './mailer.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Публичный адрес приложения нужен для ссылки сброса пароля.
// Host из запроса не используем: его можно подделать заголовком.
const APP_ORIGIN = (process.env.APP_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')).replace(/\/$/, '');
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000;
// Пароль при смене и сбросе не короче 6 символов
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Письмо отправляем только когда есть и ключ, и публичный адрес приложения:
// без APP_ORIGIN ссылка внутри письма будет неверной, такое письмо бесполезно
const getMailError = () => {
  if (!isMailConfigured()) {
    return 'Отправка писем не настроена: укажите RESEND_API_KEY на сервере';
  }
  if (!APP_ORIGIN) {
    return 'Не задан APP_ORIGIN: без него ссылка в письме будет неверной. Укажите адрес приложения в .env';
  }
  return null;
};

// В production без своего секрета токены можно подделать — лучше не стартовать
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET не задан: укажите его в .env (openssl rand -hex 32)');
  process.exit(1);
}

// CORS только для своих адресов: CORS_ORIGINS=https://crm.example.com
// Если переменная не задана (локальная разработка) — пускаем клиент CRA с порта 3000
const DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');

// В разработке телефон заходит по адресу вида http://192.168.x.x:3000 —
// разрешаем локальные сети, чтобы можно было смотреть приложение на устройстве
const isLocalNetworkOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch (err) {
    return false;
  }
};

// Предохранитель: в production без CORS_ORIGINS браузерные запросы с сайта
// получат 403 (сработал бы dev-список), поэтому громко предупреждаем при старте
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn(
    'ВНИМАНИЕ: CORS_ORIGINS не задан. Сервер разрешит только http://localhost:3000, а запросы с вашего домена получат 403. Укажите в .env: CORS_ORIGINS=https://ваш-домен'
  );
}

// За обратным прокси (Caddy) реальный адрес клиента приходит в X-Forwarded-For:
// без этого все запросы выглядели бы как запросы из контейнера прокси
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      // Запросы без Origin — curl, healthcheck, запросы с того же домена
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      const list = allowedOrigins.length > 0 ? allowedOrigins : DEV_ORIGINS;
      if (list.includes(normalized)) return callback(null, true);
      // В production по-прежнему только явный список CORS_ORIGINS
      if (process.env.NODE_ENV !== 'production' && isLocalNetworkOrigin(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: источник ${origin} не разрешён`));
    },
  })
);
app.use(express.json());

initDb();

// Без APP_ORIGIN ссылка в письме будет неполной — предупреждаем при старте
if (isMailConfigured() && !APP_ORIGIN) {
  console.warn('APP_ORIGIN не задан: письма со ссылками отправляться не будут');
}

// Необязательный Telegram: без TELEGRAM_BOT_TOKEN ничего не запускается
initTelegram();

// Напоминания о дедлайнах: каждый тик создаёт записи для колокольчика
const reminderTimer = setInterval(runReminderTick, 60 * 1000);
runReminderTick();

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

// Регистрацию можно закрыть после создания своего аккаунта: ALLOW_REGISTRATION=false
const ALLOW_REGISTRATION = (process.env.ALLOW_REGISTRATION || 'true').toLowerCase() !== 'false';

// Публичная настройка для клиента: показывать ли кнопку «Регистрация»
app.get('/api/config', (req, res) =>
  res.json({
    registrationEnabled: ALLOW_REGISTRATION,
    mailEnabled: !getMailError(),
    mailError: getMailError(),
  })
);

app.post('/api/register', (req, res) => {
  if (!ALLOW_REGISTRATION) {
    return res.status(403).json({ message: 'Регистрация закрыта' });
  }

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

// --- Защита от подбора пароля ---
// Два счётчика неудачных попыток в памяти процесса:
//  • пара «IP + email» — чтобы не перебирать пароль к одному аккаунту;
//  • IP целиком — чтобы с одного адреса не перебирать сразу много аккаунтов.
// Оба считают в окне LOGIN_WINDOW_MINUTES минут, дальше вход отвечает 429.
const LOGIN_MAX_ATTEMPTS = Math.max(1, Number(process.env.LOGIN_MAX_ATTEMPTS) || 5);
const LOGIN_MAX_ATTEMPTS_IP = Math.max(1, Number(process.env.LOGIN_MAX_ATTEMPTS_IP) || 20);
const LOGIN_WINDOW_MS = Math.max(1, Number(process.env.LOGIN_WINDOW_MINUTES) || 15) * 60 * 1000;
const loginAttempts = new Map();

const loginKey = (req, email) => `email:${req.ip}|${String(email).trim().toLowerCase()}`;
const loginIpKey = (req) => `ip:${req.ip}`;

// Запись попыток внутри текущего окна; истёкшая считается новой
const getAttempts = (key) => {
  const record = loginAttempts.get(key);
  if (!record || Date.now() - record.startedAt >= LOGIN_WINDOW_MS) return null;
  return record;
};

const registerFailedAttempt = (key) => {
  const record = getAttempts(key);
  if (record) {
    record.count += 1;
    return record.count;
  }

  loginAttempts.set(key, { startedAt: Date.now(), count: 1 });

  // Чистим просроченные записи, чтобы карта не росла бесконечно
  if (loginAttempts.size > 1000) {
    const now = Date.now();
    loginAttempts.forEach((value, entryKey) => {
      if (now - value.startedAt >= LOGIN_WINDOW_MS) loginAttempts.delete(entryKey);
    });
  }

  return 1;
};

// 429 с заголовком Retry-After до конца текущего окна
const tooManyAttempts = (res, record, message) => {
  const retryAfterSec = Math.ceil((LOGIN_WINDOW_MS - (Date.now() - record.startedAt)) / 1000);
  res.set('Retry-After', String(retryAfterSec));
  return res.status(429).json({
    message: `${message} Попробуйте через ${Math.max(1, Math.ceil(retryAfterSec / 60))} мин.`,
  });
};

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }

  const key = loginKey(req, email);
  const ipKey = loginIpKey(req);
  const attempts = getAttempts(key);
  const ipAttempts = getAttempts(ipKey);

  // Сначала общий лимит на адрес: он защищает от перебора по многим аккаунтам
  if (ipAttempts && ipAttempts.count >= LOGIN_MAX_ATTEMPTS_IP) {
    return tooManyAttempts(res, ipAttempts, 'Слишком много неудачных попыток входа с этого адреса.');
  }
  if (attempts && attempts.count >= LOGIN_MAX_ATTEMPTS) {
    return tooManyAttempts(res, attempts, 'Слишком много попыток входа.');
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    registerFailedAttempt(key);
    registerFailedAttempt(ipKey);
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  // Успешный вход сбрасывает счётчик по аккаунту, но не общий счётчик адреса:
  // иначе подобравший один свой пароль сбрасывал бы лимит
  loginAttempts.delete(key);

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

// --- Пользовательские иконки (PNG/SVG) ---
// Свои иконки храним прямо в базе как base64: файловое хранилище не нужно,
// а размер ограничен 64 КБ, чтобы база не росла.
const ICON_KEYS = new Set([
  'nav.tasks',
  'nav.diary',
  'nav.analytics',
  'nav.settings',
  'bell',
  'action.edit',
  'action.delete',
  'action.return',
]);
const ICON_MAX_BYTES = 64 * 1024;
const ICON_DATA_URL = /^data:(image\/png|image\/svg\+xml);base64,([A-Za-z0-9+/]+={0,2})$/;

app.get('/api/icons', auth, (req, res) => {
  const rows = db
    .prepare('SELECT icon_key, mime, data FROM custom_icons WHERE user_id = ?')
    .all(req.user.id);
  const icons = {};
  for (const row of rows) {
    icons[row.icon_key] = `data:${row.mime};base64,${row.data}`;
  }
  res.json({ icons });
});

app.put('/api/icons/:key', auth, (req, res) => {
  const key = req.params.key;
  if (!ICON_KEYS.has(key)) {
    return res.status(400).json({ message: 'Неизвестная иконка' });
  }
  const match = ICON_DATA_URL.exec(String((req.body && req.body.dataUrl) || ''));
  if (!match) {
    return res.status(400).json({ message: 'Поддерживаются только PNG и SVG' });
  }
  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    return res.status(400).json({ message: 'Пустой файл' });
  }
  if (buffer.length > ICON_MAX_BYTES) {
    return res.status(413).json({ message: 'Иконка больше 64 КБ' });
  }
  // Проверяем, что внутри действительно картинка заявленного формата
  if (mime === 'image/png') {
    const isPng =
      buffer.length > 8 &&
      buffer[0] === 0x89 &&
      buffer.toString('ascii', 1, 4) === 'PNG';
    if (!isPng) return res.status(400).json({ message: 'Файл не является PNG' });
  } else if (!/<svg[\s>]/i.test(buffer.toString('utf8', 0, 512))) {
    return res.status(400).json({ message: 'Файл не является SVG' });
  }

  db.prepare(
    `INSERT INTO custom_icons (user_id, icon_key, mime, data, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, icon_key)
     DO UPDATE SET mime = excluded.mime, data = excluded.data, updated_at = excluded.updated_at`
  ).run(req.user.id, key, mime, base64, new Date().toISOString());

  res.json({ key, dataUrl: `data:${mime};base64,${base64}` });
});

app.delete('/api/icons/:key', auth, (req, res) => {
  db.prepare('DELETE FROM custom_icons WHERE user_id = ? AND icon_key = ?').run(
    req.user.id,
    req.params.key
  );
  res.json({ ok: true });
});

// Обновление профиля пользователя: имя, аватар, пароль.
// Email меняется только после подтверждения по ссылке, отправленной на новый адрес.
app.put('/api/me', auth, async (req, res) => {
  const { name, avatar, email, password, currentPassword } = req.body;
  const fields = [];
  const values = [];
  let pendingEmail = null;

  if (name !== undefined) {
    fields.push('name = ?');
    values.push(String(name).trim());
  }
  if (avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(avatar);
  }

  if (email !== undefined) {
    const nextEmail = normalizeEmail(email);
    if (!EMAIL_PATTERN.test(nextEmail)) {
      return res.status(400).json({ message: 'Укажите корректный email' });
    }
    const mailError = getMailError();
    if (mailError) {
      return res.status(503).json({ message: mailError });
    }

    const current = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id);
    if (current && normalizeEmail(current.email) === nextEmail) {
      return res.status(400).json({ message: 'Это ваш текущий email' });
    }

    // Адрес не должен быть занят другим аккаунтом или уже ждать подтверждения
    const taken = db
      .prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id <> ?')
      .get(nextEmail, req.user.id);
    if (taken) {
      return res.status(409).json({ message: 'Такой email уже зарегистрирован' });
    }
    const pendingElsewhere = db
      .prepare(
        'SELECT id FROM email_change_requests WHERE LOWER(new_email) = ? AND user_id <> ? AND used_at IS NULL AND expires_at > ?'
      )
      .get(nextEmail, req.user.id, new Date().toISOString());
    if (pendingElsewhere) {
      return res.status(409).json({ message: 'Этот email уже ожидает подтверждения' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EMAIL_CHANGE_TTL_MS).toISOString();
    // Новая заявка отменяет предыдущую
    db.prepare('DELETE FROM email_change_requests WHERE user_id = ?').run(req.user.id);
    db.prepare(
      'INSERT INTO email_change_requests (user_id, new_email, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, nextEmail, hashResetToken(token), expiresAt, now.toISOString());

    const link = `${APP_ORIGIN}/confirm-email?token=${token}`;
    try {
      await sendMail({
        to: nextEmail,
        subject: 'Подтверждение смены email в CRM',
        text: `Вы запросили смену email в CRM на этот адрес. Откройте ссылку и введите пароль от аккаунта: ${link}\nСсылка действует час.`,
        html: `<p>Вы запросили смену email в CRM на этот адрес.</p><p><a href="${link}">Подтвердить смену email</a></p><p>На странице потребуется ввести пароль от аккаунта. Ссылка действует час.</p><p>Если вы не запрашивали смену, просто проигнорируйте письмо.</p>`,
      });
    } catch (err) {
      console.error('Смена email: письмо не отправлено —', err.message);
      db.prepare('DELETE FROM email_change_requests WHERE user_id = ?').run(req.user.id);
      return res.status(502).json({ message: 'Не удалось отправить письмо на новый адрес' });
    }
    pendingEmail = nextEmail;
  }

  if (password !== undefined) {
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` });
    }
    const row = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    // Смена пароля только с подтверждением текущего
    if (!currentPassword || !row || !bcrypt.compareSync(String(currentPassword), row.password)) {
      return res.status(400).json({ message: 'Текущий пароль указан неверно' });
    }
    fields.push('password = ?');
    values.push(bcrypt.hashSync(String(password), 10));
  }

  if (fields.length === 0 && !pendingEmail) {
    return res.status(400).json({ message: 'Нет полей для обновления' });
  }
  if (fields.length > 0) {
    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  const user = db
    .prepare('SELECT id, name, email, avatar FROM users WHERE id = ?')
    .get(req.user.id);
  res.json({ ...user, token: signToken(user), pendingEmail });
});

// Проверка ссылки из письма: какие данные подтверждаем
app.get('/api/auth/email-change', (req, res) => {
  const token = String(req.query.token || '');
  const row = db
    .prepare(
      'SELECT new_email, expires_at, used_at FROM email_change_requests WHERE token_hash = ?'
    )
    .get(hashResetToken(token));
  if (!token || !row || row.used_at || row.expires_at < new Date().toISOString()) {
    return res.status(400).json({ message: 'Ссылка недействительна или устарела' });
  }
  res.json({ email: row.new_email });
});

// Подтверждение смены email: ссылка из письма + пароль от аккаунта
app.post('/api/auth/confirm-email', (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (!token || !password) {
    return res.status(400).json({ message: 'Ссылка недействительна или пароль не указан' });
  }

  const now = new Date().toISOString();
  const row = db
    .prepare(
      `SELECT r.id, r.user_id, r.new_email, r.expires_at, r.used_at, u.password AS password_hash
         FROM email_change_requests r
         JOIN users u ON u.id = r.user_id
        WHERE r.token_hash = ?`
    )
    .get(hashResetToken(token));
  if (!row || row.used_at || row.expires_at < now) {
    return res.status(400).json({ message: 'Ссылка недействительна или устарела' });
  }
  if (!bcrypt.compareSync(password, row.password_hash)) {
    return res.status(400).json({ message: 'Пароль указан неверно' });
  }

  // Пока ссылка ждала, адрес мог занять другой аккаунт
  const taken = db
    .prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id <> ?')
    .get(row.new_email.toLowerCase(), row.user_id);
  if (taken) {
    return res.status(409).json({ message: 'Этот email уже зарегистрирован' });
  }

  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(row.new_email, row.user_id);
  db.prepare('UPDATE email_change_requests SET used_at = ? WHERE id = ?').run(now, row.id);
  db.prepare('DELETE FROM email_change_requests WHERE user_id = ? AND id <> ?').run(
    row.user_id,
    row.id
  );

  res.json({ ok: true, email: row.new_email });
});

// --- Сброс пароля по ссылке из письма ---

// Ограничение на количество запросов ссылки с одного адреса
const RESET_MAX_REQUESTS = Math.max(1, Number(process.env.RESET_MAX_REQUESTS) || 5);
const RESET_WINDOW_MS = 15 * 60 * 1000;
const resetRequests = new Map();

const allowResetRequest = (ip) => {
  const record = resetRequests.get(ip);
  if (!record || Date.now() - record.startedAt >= RESET_WINDOW_MS) {
    resetRequests.set(ip, { startedAt: Date.now(), count: 1 });
    return true;
  }
  record.count += 1;
  return record.count <= RESET_MAX_REQUESTS;
};

// Письмо со ссылкой. Существование аккаунта не раскрываем: ответ всегда одинаковый
app.post('/api/auth/forgot-password', async (req, res) => {
  const mailError = getMailError();
  if (mailError) {
    return res.status(503).json({ message: mailError });
  }

  const email = normalizeEmail(req.body.email);
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Укажите корректный email' });
  }

  if (!allowResetRequest(req.ip)) {
    return res
      .status(429)
      .json({ message: 'Слишком много запросов. Попробуйте через 15 минут.' });
  }

  const user = db.prepare('SELECT id, email FROM users WHERE LOWER(email) = ?').get(email);
  if (!user) {
    return res.json({ sent: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MS).toISOString();
  // Старые ссылки перестают работать: активной остаётся только последняя
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);
  db.prepare(
    'INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(user.id, hashResetToken(token), expiresAt, now.toISOString());

  const link = `${APP_ORIGIN}/reset?token=${token}`;
  try {
    await sendMail({
      to: user.email,
      subject: 'Сброс пароля CRM',
      text: `Чтобы задать новый пароль, перейдите по ссылке: ${link}\nСсылка действует час.`,
      html: `<p>Чтобы задать новый пароль, перейдите по ссылке:</p><p><a href="${link}">${link}</a></p><p>Ссылка действует час. Если вы не запрашивали сброс, просто проигнорируйте письмо.</p>`,
    });
  } catch (err) {
    console.error('Сброс пароля: письмо не отправлено —', err.message);
    return res.status(502).json({ message: 'Не удалось отправить письмо' });
  }

  res.json({ sent: true });
});

// Установка нового пароля по одноразовому токену из письма
app.post('/api/auth/reset-password', (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (!token || !password) {
    return res.status(400).json({ message: 'Ссылка недействительна' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ message: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` });
  }

  const now = new Date().toISOString();
  const row = db
    .prepare('SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?')
    .get(hashResetToken(token));
  if (!row || row.used_at || row.expires_at < now) {
    return res.status(400).json({ message: 'Ссылка недействительна или устарела' });
  }

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(
    bcrypt.hashSync(password, 10),
    row.user_id
  );
  // Токен одноразовый: помечаем использованным и удаляем остальные
  db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(now, row.id);
  db.prepare('DELETE FROM password_resets WHERE user_id = ? AND id <> ?').run(row.user_id, row.id);

  res.json({ ok: true });
});

// --- Telegram (необязательная привязка личного бота) ---

// Статус: настроен ли бот на сервере и привязан ли чат у текущего пользователя
app.get('/api/telegram/status', auth, (req, res) => res.json(getStatus(req.user.id)));

// Одноразовый код и ссылка t.me/<bot>?start=<код>
app.post('/api/telegram/link', auth, (req, res) => {
  const link = createLinkCode(req.user.id);
  if (!link) {
    return res.status(503).json({ message: 'Бот не настроен на сервере' });
  }
  res.json(link);
});

app.delete('/api/telegram/link', auth, (req, res) => {
  unlink(req.user.id);
  res.json({ linked: false });
});

// Проверочное сообщение в привязанный чат
app.post('/api/telegram/test', auth, async (req, res) => {
  const user = db.prepare('SELECT telegram_chat_id FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.telegram_chat_id) {
    return res.status(400).json({ message: 'Сначала привяжите Telegram' });
  }
  try {
    await sendMessage(user.telegram_chat_id, 'Проверка связи: CRM');
    res.json({ sent: true });
  } catch (err) {
    console.error('Telegram: не удалось отправить сообщение —', err.message);
    res.status(502).json({ message: 'Не удалось отправить сообщение в Telegram' });
  }
});

// --- Уведомления (колокольчик) ---

// Список уведомлений и число непрочитанных.
// Часовой пояс приходит из браузера — по нему считаются 6 часов и час до дедлайна
app.get('/api/notifications', auth, (req, res) => {
  saveTimezone(req.user.id, req.query.tz);

  const items = db
    .prepare(
      `SELECT id, task_id, kind, task_name, deadline, deadline_time, created_at, read_at
         FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 50`
    )
    .all(req.user.id)
    .map((row) => ({ ...row, read: Boolean(row.read_at) }));

  const { unread } = db
    .prepare('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .get(req.user.id);

  res.json({ items, unread });
});

app.post('/api/notifications/:id/read', auth, (req, res) => {
  // Повторное прочтение и чужую запись не считаем ошибкой: для клиента итог один
  db.prepare(
    'UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL'
  ).run(new Date().toISOString(), req.params.id, req.user.id);
  res.json({ read: true });
});

app.post('/api/notifications/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(
    new Date().toISOString(),
    req.user.id
  );
  res.json({ read: true });
});

// --- Универсальный CRUD для пользовательских сущностей ---

function crud(route, table, fields, requiredField, decorateRow, validate, beforeDelete) {
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
    const validationError = validate ? validate(req, null) : null;
    if (validationError) return res.status(400).json({ message: validationError });
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

    const validationError = validate ? validate(req, existing) : null;
    if (validationError) return res.status(400).json({ message: validationError });

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
    const existing = db
      .prepare(`SELECT id FROM ${table} WHERE id = ? AND user_id = ?`)
      .get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ message: 'Запись не найдена' });

    // Связанные записи обрабатываются до удаления (подзадачи отвязываются)
    if (beforeDelete) beforeDelete(existing.id, req.user.id);

    db.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`).run(
      existing.id,
      req.user.id
    );
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
  ['name', 'description', 'priority', 'deadline', 'deadline_time', 'status', 'comment', 'group_id', 'parent_id'],
  'name',
  withComments,
  // Дедлайн в прошлом не принимаем. Проверяем только когда он пришёл в запросе:
  // смена статуса или правка названия не должны упираться в уже прошедший срок
  (req, existing) => {
    // Подзадача: только один уровень вложенности, только в свою основную задачу
    if (Object.prototype.hasOwnProperty.call(req.body, 'parent_id')) {
      const rawParent = req.body.parent_id;
      const parentId = rawParent === null || rawParent === '' ? null : Number(rawParent);
      if (parentId !== null) {
        if (!Number.isInteger(parentId) || parentId <= 0) {
          return 'Некорректная основная задача';
        }
        if (existing && existing.id === parentId) {
          return 'Задача не может быть подзадачей самой себя';
        }
        const parent = db
          .prepare('SELECT id, parent_id FROM tasks WHERE id = ? AND user_id = ?')
          .get(parentId, req.user.id);
        if (!parent) return 'Основная задача не найдена';
        if (parent.parent_id) return 'Подзадачу нельзя вложить в другую подзадачу';
        if (existing) {
          const { count } = db
            .prepare('SELECT COUNT(*) AS count FROM tasks WHERE parent_id = ? AND user_id = ?')
            .get(existing.id, req.user.id);
          if (count > 0) return 'Сначала снимите подзадачи с этой задачи';
        }
      }
    }

    const hasDeadlineField =
      Object.prototype.hasOwnProperty.call(req.body, 'deadline') ||
      Object.prototype.hasOwnProperty.call(req.body, 'deadline_time');
    if (!hasDeadlineField) return null;

    const deadline = Object.prototype.hasOwnProperty.call(req.body, 'deadline')
      ? req.body.deadline
      : existing && existing.deadline;
    if (!deadline) return null;

    const time = Object.prototype.hasOwnProperty.call(req.body, 'deadline_time')
      ? req.body.deadline_time
      : existing && existing.deadline_time;

    // Старый просроченный дедлайн можно сохранить без изменений (правка названия)
    const unchanged =
      existing &&
      String(deadline) === String(existing.deadline || '') &&
      String(time || '') === String(existing.deadline_time || '');
    if (unchanged) return null;

    return isDeadlineInPast(deadline, time, getUserTimezone(req.user.id))
      ? 'Дедлайн не может быть в прошлом'
      : null;
  },
  // Подзадачи не удаляются вместе с основной, а становятся отдельными задачами
  (taskId, userId) => {
    db.prepare('UPDATE tasks SET parent_id = NULL WHERE parent_id = ? AND user_id = ?').run(
      taskId,
      userId
    );
  }
);
crud('diary', 'diary', ['topic', 'text', 'date'], 'text');

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

// --- Статика собранного клиента ---

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Неизвестный метод API не должен проваливаться в index.html
app.use('/api', (req, res) => res.status(404).json({ message: 'Неизвестный метод API' }));

const clientBuildDir = process.env.CLIENT_BUILD_DIR || path.join(__dirname, '..', 'build');
const clientIndex = path.join(clientBuildDir, 'index.html');

if (fs.existsSync(clientIndex)) {
  // Файлы с хэшем в имени можно кэшировать надолго, index.html — нет
  app.use(
    '/static',
    express.static(path.join(clientBuildDir, 'static'), { immutable: true, maxAge: '1y' })
  );
  app.use(express.static(clientBuildDir, { index: false, maxAge: '1h' }));
  // Любой не-API адрес отдаёт React-приложение (клиентский роутинг)
  app.get(/^\/(?!api\/|static\/).*/, (req, res) => res.sendFile(clientIndex));
} else {
  console.warn(`Сборка клиента не найдена (${clientIndex}). Выполните npm run build.`);
}

// --- Обработчик ошибок ---

app.use((err, req, res, next) => {
  // Запрещённый источник CORS — это не поломка сервера, отвечаем 403 без стека
  if (typeof err.message === 'string' && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Ошибка сервера' });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Корректное завершение (docker stop): дожидаемся закрытия соединений и базы
const shutdown = (signal) => {
  console.log(`${signal}: останавливаюсь`);
  server.close(() => {
    clearInterval(reminderTimer);
    stopTelegram();
    db.close();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

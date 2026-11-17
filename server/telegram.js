// Привязка личного Telegram-бота к аккаунту CRM.
// Токен бота живёт только в переменной окружения TELEGRAM_BOT_TOKEN и в базе не хранится.
// Новые зависимости не нужны: Bot API дёргаем встроенным fetch из Node 20.
import crypto from 'crypto';
import db from './database.js';

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const API_BASE = `https://api.telegram.org/bot${TOKEN}`;

// Код привязки живёт 15 минут: за это время пользователь успевает открыть бота
const LINK_TTL_MS = 15 * 60 * 1000;
// Long polling: сервер держит запрос открытым, пока бот не получит сообщение
const POLL_TIMEOUT_SEC = 25;
const POLL_REQUEST_TIMEOUT_MS = (POLL_TIMEOUT_SEC + 15) * 1000;
const RETRY_DELAY_MS = 5000;

let botUsername = null;
let pollController = null;

const isConfigured = () => Boolean(TOKEN);

// Один запрос к Bot API. Абстрактный таймаут нужен, чтобы «зависший» запрос
// не блокировал опрос и не копил сокеты.
async function callApi(method, payload, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || !data.ok) {
      const description = (data && data.description) || `HTTP ${response.status}`;
      const error = new Error(`${method}: ${description}`);
      error.status = response.status;
      throw error;
    }
    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

// Имя бота нужно для ссылки t.me/<bot>?start=<код>.
// Если запрос не удался (нет сети, неверный токен) — просто пишем в лог:
// сервер продолжает работать, а в настройках будет «бот не настроен».
async function loadBotInfo() {
  try {
    const me = await callApi('getMe', {}, { timeoutMs: 10000 });
    if (me && me.username) {
      botUsername = me.username;
      console.log(`Telegram: бот @${botUsername} готов принимать сообщения`);
    }
  } catch (err) {
    console.warn('Telegram: не удалось получить данные бота —', err.message);
  }
}

export function isTelegramConfigured() {
  return isConfigured() && Boolean(botUsername);
}

// Статус для блока в настройках
export function getStatus(userId) {
  const row = db
    .prepare('SELECT telegram_chat_id, telegram_username FROM users WHERE id = ?')
    .get(userId);
  return {
    configured: isTelegramConfigured(),
    linked: Boolean(row && row.telegram_chat_id),
    username: (row && row.telegram_username) || null,
    botUsername: botUsername || null,
  };
}

// Одноразовый код и ссылка на бота. Возвращает null, если бот не настроен.
export function createLinkCode(userId) {
  if (!isTelegramConfigured()) return null;
  const code = crypto.randomBytes(4).toString('hex');
  const expiresAt = new Date(Date.now() + LINK_TTL_MS).toISOString();
  db.prepare('UPDATE users SET telegram_link_code = ?, telegram_link_expires = ? WHERE id = ?').run(
    code,
    expiresAt,
    userId
  );
  return {
    code,
    expiresAt,
    botUsername,
    deeplink: `https://t.me/${botUsername}?start=${code}`,
  };
}

export function unlink(userId) {
  db.prepare(
    `UPDATE users SET
       telegram_chat_id = NULL,
       telegram_username = NULL,
       telegram_link_code = NULL,
       telegram_link_expires = NULL,
       telegram_linked_at = NULL
     WHERE id = ?`
  ).run(userId);
}

export async function sendMessage(chatId, text) {
  if (!isConfigured()) throw new Error('Telegram не настроен');
  return callApi('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

// Пауза, которую можно прервать при остановке сервера
function sleep(ms, signal) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

async function handleStart(message, chatId, payload) {
  const username = (message.from && message.from.username) || null;

  if (!payload) {
    // Просто /start без кода: подсказываем, где взять ссылку
    await sendMessage(
      chatId,
      'Откройте CRM → Настройки → «Привязать Telegram» и перейдите по ссылке из настроек.'
    );
    return;
  }

  const user = db
    .prepare('SELECT id, telegram_link_expires FROM users WHERE telegram_link_code = ?')
    .get(payload);
  const expiresAt = user && user.telegram_link_expires ? new Date(user.telegram_link_expires) : null;
  const expired = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now();

  if (!user || expired) {
    await sendMessage(
      chatId,
      'Код не найден или истёк. Получите новый в CRM: Настройки → «Привязать Telegram».'
    );
    return;
  }

  db.prepare(
    `UPDATE users SET
       telegram_chat_id = ?,
       telegram_username = ?,
       telegram_linked_at = ?,
       telegram_link_code = NULL,
       telegram_link_expires = NULL
     WHERE id = ?`
  ).run(String(chatId), username, new Date().toISOString(), user.id);

  await sendMessage(chatId, 'Telegram подключён к CRM. Сообщения из CRM будут приходить сюда.');
}

async function handleStop(chatId) {
  const user = db.prepare('SELECT id FROM users WHERE telegram_chat_id = ?').get(String(chatId));
  if (!user) {
    await sendMessage(chatId, 'Этот чат не привязан к CRM.');
    return;
  }
  unlink(user.id);
  await sendMessage(chatId, 'Telegram отключён от CRM. Привязать снова можно в настройках.');
}

// Обработка одного обновления от бота. Ошибки отправки не должны ломать опрос.
async function handleUpdate(update) {
  const message = update && update.message;
  if (!message || !message.chat || typeof message.text !== 'string') return;

  const chatId = message.chat.id;
  const parts = message.text.trim().split(/\s+/);
  const command = parts[0];
  const payload = parts[1] || '';

  if (command === '/start') {
    await handleStart(message, chatId, payload);
  } else if (command === '/stop') {
    await handleStop(chatId);
  }
}

async function pollingLoop(controller) {
  let offset = null;
  // Первый проход пропускает накопившиеся обновления: после перезапуска сервера
  // старые команды не должны привязывать чат повторно
  let firstPass = true;

  while (!controller.signal.aborted) {
    try {
      if (!botUsername) await loadBotInfo();
      if (!isTelegramConfigured()) {
        // Токен неверный или сеть недоступна — пробуем позже, сервер работает
        await sleep(RETRY_DELAY_MS, controller.signal);
        continue;
      }

      const updates = await callApi(
        'getUpdates',
        { timeout: POLL_TIMEOUT_SEC, offset: offset === null ? -1 : offset, allowed_updates: ['message'] },
        { timeoutMs: POLL_REQUEST_TIMEOUT_MS }
      );

      if (Array.isArray(updates) && updates.length > 0) {
        offset = updates[updates.length - 1].update_id + 1;
        if (!firstPass) {
          for (const update of updates) {
            try {
              await handleUpdate(update);
            } catch (err) {
              console.warn('Telegram: не удалось обработать сообщение —', err.message);
            }
          }
        }
      }
      firstPass = false;
    } catch (err) {
      if (controller.signal.aborted) break;
      console.warn('Telegram: опрос не удался —', err.message);
      await sleep(RETRY_DELAY_MS, controller.signal);
    }
  }
}

// Запуск при старте сервера: без токена ничего не делаем
export function initTelegram() {
  if (!isConfigured()) {
    console.log('Telegram: TELEGRAM_BOT_TOKEN не задан — подключение в настройках выключено');
    return;
  }
  if (pollController) return;
  pollController = new AbortController();
  const controller = pollController;
  pollingLoop(controller).catch((err) => {
    console.warn('Telegram: опрос остановлен —', err.message);
  });
}

export function stopTelegram() {
  if (pollController) {
    pollController.abort();
    pollController = null;
  }
}

// Базовый хелпер для работы с API: единая точка для адреса, токена и ошибок.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Событие «сессия истекла». Его слушает AuthContext: сбрасывает пользователя,
// после чего ProtectedRoute уводит на страницу входа.
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

// Логин и регистрация тоже отвечают 401 при неверных данных — для них
// глобальный сброс сессии не нужен, сообщение об ошибке показывается как есть.
const AUTH_PATHS = ['/login', '/register'];

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

// Чистит токен и сообщает приложению об истёкшей сессии.
// Повторные 401 от параллельных запросов игнорируются, если токена уже нет.
function handleUnauthorized() {
  if (!getToken()) return;
  setToken(null);
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

/**
 * Выполняет запрос к API.
 * @param {string} path - путь без префикса /api, например '/tasks'
 * @param {object} options - { method, body }
 * @returns {Promise<any>} разобранный JSON ответа
 * @throws {Error} с полем status при неуспешном ответе
 */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Не удалось соединиться с сервером');
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    // Истёкшая сессия: токен недействителен — сбрасываем его глобально
    if (response.status === 401 && !AUTH_PATHS.some((authPath) => path.startsWith(authPath))) {
      handleUnauthorized();
    }
    const error = new Error((data && data.message) || `Ошибка запроса (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

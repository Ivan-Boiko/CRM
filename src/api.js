// Базовый хелпер для работы с API: единая точка для адреса, токена и ошибок.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    const error = new Error((data && data.message) || `Ошибка запроса (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

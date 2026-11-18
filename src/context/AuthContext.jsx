import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getToken, setToken, UNAUTHORIZED_EVENT } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // При загрузке приложения проверяем сохранённый токен
  useEffect(() => {
    let active = true;
    async function loadUser() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch('/me');
        if (active) setUser(me);
      } catch (err) {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUser();
    return () => {
      active = false;
    };
  }, []);

  // Глобальная обработка истёкшей сессии: api.js уже почистил токен и прислал событие.
  // После сброса user ProtectedRoute уводит на страницу входа.
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch('/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await apiFetch('/register', { method: 'POST', body: { name, email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Перечитать профиль: нужно после подтверждения смены email
  const refreshUser = async () => {
    const me = await apiFetch('/me');
    setUser(me);
    return me;
  };

  // Обновление профиля (имя, аватар, email, пароль).
  // При смене email сервер выдаёт новый токен — сохраняем его отдельно от user.
  const updateUser = async (data) => {
    const updated = await apiFetch('/me', { method: 'PUT', body: data });
    const { token, ...profile } = updated;
    if (token) setToken(token);
    setUser(profile);
    return profile;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

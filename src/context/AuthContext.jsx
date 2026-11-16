import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getToken, setToken } from '../api';

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

  // Обновление профиля (имя, аватар и т.д.)
  const updateUser = async (data) => {
    const updated = await apiFetch('/me', { method: 'PUT', body: data });
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

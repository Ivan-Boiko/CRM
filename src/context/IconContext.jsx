// IconContext.jsx — свои иконки пользователя (PNG/SVG).
// Основное хранилище — сервер (data URL в базе). Если сервер ещё не обновлён
// и маршрута /api/icons нет, иконки временно живут в localStorage этого браузера,
// а после обновления сервера автоматически переносятся в базу.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, getToken } from '../api';
import { useAuth } from './AuthContext';

const IconContext = createContext(null);
const STORAGE_PREFIX = 'crm:icons:';

const storageKey = (userId) => `${STORAGE_PREFIX}${userId ?? 'guest'}`;

const readLocal = (userId) => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
};

const writeLocal = (userId, icons) => {
  try {
    if (Object.keys(icons).length > 0) {
      localStorage.setItem(storageKey(userId), JSON.stringify(icons));
    } else {
      localStorage.removeItem(storageKey(userId));
    }
  } catch (err) {
    // Переполнение localStorage не должно ломать приложение
  }
};

export const IconProvider = ({ children }) => {
  const { user } = useAuth();
  const [icons, setIcons] = useState({});
  // true, когда сервер ответил 404 и иконки хранятся только в браузере
  const [localOnly, setLocalOnly] = useState(false);

  const reload = useCallback(async () => {
    if (!getToken()) {
      setIcons({});
      return;
    }
    const local = readLocal(user?.id);
    try {
      const data = await apiFetch('/icons');
      const merged = { ...((data && data.icons) || {}) };
      // Локальные иконки, которых нет на сервере, переносим в базу
      const pending = Object.entries(local).filter(([key]) => !merged[key]);
      for (const [key, dataUrl] of pending) {
        try {
          await apiFetch(`/icons/${encodeURIComponent(key)}`, {
            method: 'PUT',
            body: { dataUrl },
          });
          merged[key] = dataUrl;
        } catch (err) {
          // Сервер не принял конкретную иконку — оставляем её локально
        }
      }
      const stillLocal = Object.fromEntries(
        Object.entries(local).filter(([key]) => !merged[key])
      );
      writeLocal(user?.id, stillLocal);
      setLocalOnly(false);
      setIcons(merged);
    } catch (err) {
      // Старый сервер без /api/icons: показываем то, что сохранено в браузере
      setLocalOnly(err.status === 404);
      setIcons(readLocal(user?.id));
    }
  }, [user?.id]);

  // После входа и смены пользователя подтягиваем его набор иконок
  useEffect(() => {
    reload();
  }, [reload, user?.id]);

  const saveIcon = useCallback(
    async (key, dataUrl) => {
      try {
        const data = await apiFetch(`/icons/${encodeURIComponent(key)}`, {
          method: 'PUT',
          body: { dataUrl },
        });
        setIcons((prev) => ({ ...prev, [key]: data.dataUrl }));
        const local = readLocal(user?.id);
        if (local[key]) {
          delete local[key];
          writeLocal(user?.id, local);
        }
      } catch (err) {
        if (err.status !== 404) throw err;
        const local = { ...readLocal(user?.id), [key]: dataUrl };
        writeLocal(user?.id, local);
        setLocalOnly(true);
        setIcons((prev) => ({ ...prev, [key]: dataUrl }));
      }
    },
    [user?.id]
  );

  const removeIcon = useCallback(
    async (key) => {
      try {
        await apiFetch(`/icons/${encodeURIComponent(key)}`, { method: 'DELETE' });
      } catch (err) {
        if (err.status !== 404) throw err;
      }
      const local = readLocal(user?.id);
      if (local[key]) {
        delete local[key];
        writeLocal(user?.id, local);
      }
      setIcons((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [user?.id]
  );

  const value = useMemo(
    () => ({ icons, localOnly, reload, saveIcon, removeIcon }),
    [icons, localOnly, reload, saveIcon, removeIcon]
  );

  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
};

export const useIcons = () => {
  const context = useContext(IconContext);
  if (!context) {
    return {
      icons: {},
      localOnly: false,
      reload: async () => {},
      saveIcon: async () => {},
      removeIcon: async () => {},
    };
  }
  return context;
};

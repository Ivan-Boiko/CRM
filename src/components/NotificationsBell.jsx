import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './NotificationsBell.css';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext';
import AppIcon from './AppIcon';

// Больше 99 в бейдже не показываем — цифра не влезет в кружок
const MAX_BADGE = 99;

// Колокольчик в шапке: счётчик непрочитанных и панель со списком напоминаний.
// Сервер создаёт записи сам (за 6 часов и за час до дедлайна), клиент их только показывает.
const NotificationsBell = ({ onOpenTask }) => {
  const { t, formatDate } = useLanguage();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Пояс браузера отправляем при каждом опросе: по нему сервер считает время дедлайна
  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (err) {
      return '';
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/notifications?tz=${encodeURIComponent(timezone)}`);
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch (err) {
      // Молча: при обрыве сети колокольчик не должен показывать тост на каждой проверке
    }
  }, [timezone]);

  // Опрос раз в минуту и сразу при возвращении на вкладку
  useEffect(() => {
    load();
    const timer = setInterval(load, 60 * 1000);
    const handleFocus = () => load();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load]);

  // Закрытие панели по клику вне её и по Escape
  useEffect(() => {
    if (!open) return undefined;
    const handleMouseDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const markRead = async (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
    } catch (err) {
      // Не получилось — вернём актуальное состояние с сервера
      load();
    }
  };

  const handleReadAll = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnread(0);
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
    } catch (err) {
      load();
    }
  };

  const handleItemClick = (item) => {
    setOpen(false);
    if (!item.read) markRead(item.id);
    if (item.task_id) onOpenTask?.(item.task_id);
  };

  // Дата и время дедлайна одной строкой: «20.11.2026, 18:00»
  const deadlineLabel = (item) => {
    const date = formatDate(item.deadline);
    return `${date}${item.deadline_time ? `, ${item.deadline_time}` : ''}`;
  };

  // Срок уже прошёл: старое «через 6 часов» было бы неправдой
  const isPassed = (item) => {
    if (!item.deadline) return false;
    const at = new Date(`${item.deadline}T${item.deadline_time || '23:59'}:00`);
    return !Number.isNaN(at.getTime()) && at.getTime() < Date.now();
  };

  return (
    <div className="notifications" ref={rootRef}>
      <button
        type="button"
        className="notifications__button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('notifications.title')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <AppIcon name="bell" fallback="🔔" />
        {unread > 0 && (
          <span className="notifications__badge">
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notifications__panel" role="dialog" aria-label={t('notifications.title')}>
          <div className="notifications__header">
            <span className="notifications__title">{t('notifications.title')}</span>
            {unread > 0 && (
              <button type="button" className="notifications__read-all" onClick={handleReadAll}>
                {t('notifications.markAll')}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="notifications__empty">{t('notifications.empty')}</div>
          ) : (
            <ul className="notifications__list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notifications__item${item.read ? '' : ' notifications__item--unread'}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="notifications__item-title">{item.task_name}</span>
                    <span
                      className={`notifications__item-meta${
                        isPassed(item) ? ' notifications__item-meta--passed' : ''
                      }`}
                    >
                      {isPassed(item)
                        ? t('notifications.overdue')
                        : t(item.kind === '6h' ? 'notifications.in6h' : 'notifications.in1h')}
                    </span>
                    <span className="notifications__item-deadline">
                      {t('notifications.deadline', { date: deadlineLabel(item) })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;

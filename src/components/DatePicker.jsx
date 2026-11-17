import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './DatePicker.css';
import { useLanguage } from '../context/LanguageContext';

// Размеры календаря нужны, чтобы открыть его вверх, если снизу нет места
const CALENDAR_WIDTH = 300;
const CALENDAR_HEIGHT = 336;

// Значение хранится как ISO-строка YYYY-MM-DD — в таком виде его ждёт сервер
const parseISO = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a, b) =>
  Boolean(a) && Boolean(b) &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Сетка на 6 недель начинается с понедельника
const buildMonthDays = (viewDate) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, 1 - offset + index));
};

const WEEKDAYS = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

// Календарь в стиле выпадающих списков: кнопка как у поля формы, меню — карточка в portal
const DatePicker = ({ id, value, onChange, ariaLabel }) => {
  const { t, lang, formatDate } = useLanguage();
  const [open, setOpen] = useState(false);
  const [calendarStyle, setCalendarStyle] = useState(null);
  const [viewDate, setViewDate] = useState(() => parseISO(value) || new Date());
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const calendarRef = useRef(null);

  const selectedDate = parseISO(value);
  const today = startOfDay(new Date());
  const days = useMemo(() => buildMonthDays(viewDate), [viewDate]);
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';

  // «Ноябрь 2026» — месяц берём в локали, без лишнего «г.»
  const monthLabel = useMemo(() => {
    const month = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toLocaleDateString(locale, { month: 'long' });
    return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${viewDate.getFullYear()}`;
  }, [viewDate, locale]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // Календарь всегда одной ширины — растягивать его на широкое поле не нужно
    const width = Math.min(CALENDAR_WIDTH, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const opensUp = window.innerHeight - rect.bottom < CALENDAR_HEIGHT + 12;
    const top = opensUp ? Math.max(8, rect.top - CALENDAR_HEIGHT - 6) : rect.bottom + 6;
    setCalendarStyle({ top, left, width });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();

    const handleMouseDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (calendarRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (event.key === 'Tab') setOpen(false);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const openCalendar = () => {
    updatePosition();
    setViewDate(selectedDate || new Date());
    setOpen(true);
  };

  const pickDay = (day) => {
    setOpen(false);
    onChange(toISO(day));
  };

  const shiftMonth = (delta) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const calendar = open && calendarStyle
    ? createPortal(
        <div className="date-picker__calendar" style={calendarStyle} ref={calendarRef}>
          <div className="date-picker__header">
            <button
              type="button"
              className="date-picker__nav"
              onClick={() => shiftMonth(-1)}
              aria-label={t('date.prevMonth')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="date-picker__month">{monthLabel}</span>
            <button
              type="button"
              className="date-picker__nav"
              onClick={() => shiftMonth(1)}
              aria-label={t('date.nextMonth')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="date-picker__weekdays">
            {WEEKDAYS[lang]?.map((day) => (
              <span key={day} className="date-picker__weekday">
                {day}
              </span>
            ))}
          </div>

          <div className="date-picker__grid">
            {days.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const isOutside = day.getMonth() !== viewDate.getMonth();
              return (
                <button
                  key={toISO(day)}
                  type="button"
                  className={[
                    'date-picker__day',
                    isOutside ? 'date-picker__day--outside' : '',
                    isToday ? 'date-picker__day--today' : '',
                    isSelected ? 'date-picker__day--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => pickDay(day)}
                  aria-pressed={isSelected}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="date-picker__footer">
            <button
              type="button"
              className="date-picker__action"
              onClick={() => {
                setOpen(false);
                onChange('');
              }}
              disabled={!value}
            >
              {t('date.clear')}
            </button>
            <button
              type="button"
              className="date-picker__action date-picker__action--accent"
              onClick={() => {
                setViewDate(new Date());
                pickDay(new Date());
              }}
            >
              {t('date.today')}
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="date-picker" ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        className={`select__button date-picker__button${open ? ' select__button--open' : ''}`}
        onClick={() => (open ? setOpen(false) : openCalendar())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={`date-picker__value${value ? '' : ' date-picker__value--empty'}`}>
          {value ? formatDate(value) : t('date.placeholder')}
        </span>
        <span className="date-picker__icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="3" x2="8" y2="7" />
            <line x1="16" y1="3" x2="16" y2="7" />
          </svg>
        </span>
      </button>
      {calendar}
    </div>
  );
};

export default DatePicker;

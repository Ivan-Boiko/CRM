import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './StatusSelect.css';
import { useLanguage } from '../context/LanguageContext';

// Порядок статусов в выпадающем списке
const STATUSES = ['todo', 'in-progress', 'done'];
// Примерная высота меню — нужна, чтобы открыть его вверх, если снизу нет места
const MENU_HEIGHT = 132;
const MENU_MIN_WIDTH = 190;

// Смена статуса прямо в строке: кнопка выглядит как бейдж, меню — как аккуратная карточка.
// Меню рендерится в portal: таблица обрезает всё, что выходит за её края.
const StatusSelect = ({ value, onChange, ariaLabel }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Позиция меню в координатах окна: под кнопкой, а если места мало — над ней
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, MENU_MIN_WIDTH);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    const opensUp = window.innerHeight - rect.bottom < MENU_HEIGHT + 12;
    const top = opensUp ? Math.max(8, rect.top - MENU_HEIGHT - 6) : rect.bottom + 6;
    setMenuStyle({ top, left: Math.max(8, left), width });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();

    const handleMouseDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    // Пока меню открыто, следим за кнопкой: при скролле и ресайзе меню едет вместе с ней
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

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
    } else {
      updatePosition();
      setOpen(true);
    }
  };

  const selectStatus = (status) => {
    setOpen(false);
    if (status !== value) onChange(status);
  };

  const menu = open && menuStyle
    ? createPortal(
        <ul className="status-select__menu" role="listbox" style={menuStyle} ref={menuRef}>
          {STATUSES.map((status) => {
            const isActive = status === value;
            return (
              <li key={status}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`status-select__option${isActive ? ' status-select__option--active' : ''}`}
                  onClick={() => selectStatus(status)}
                >
                  <span className={`status-select__dot status-select__dot--${status}`} aria-hidden="true" />
                  <span className="status-select__label">{t(`status.${status}`)}</span>
                  {isActive ? (
                    <span className="status-select__check" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )
    : null;

  return (
    <div className="status-select" ref={rootRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        ref={buttonRef}
        className={`tasks__status tasks__status--${value} status-select__button`}
        onClick={toggleMenu}
        onKeyDown={(event) => event.stopPropagation()}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {t(`status.${value}`)}
        <span className="status-select__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {menu}
    </div>
  );
};

export default StatusSelect;

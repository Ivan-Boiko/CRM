import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Select.css';

// Примерная высота одного пункта меню — по ней считается, влезает ли меню под кнопку
const OPTION_HEIGHT = 44;
const MENU_PADDING = 6;

// Красивый выпадающий список: кнопка выглядит как поле формы, меню — карточка в portal.
// Portal нужен потому, что модалки и таблица обрезают всё, что выходит за их края.
const Select = ({ id, value, options, onChange, ariaLabel, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const activeIndexRef = useRef(-1);

  const selected = options.find((option) => String(option.value) === String(value)) || null;
  const menuHeight = options.length * OPTION_HEIGHT + MENU_PADDING * 2;

  // Позиция меню в координатах окна: под кнопкой, а если снизу нет места — над ней
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // Меню не растягиваем на всю ширину широкого поля — так оно читается как карточка
    const width = Math.min(Math.max(rect.width, 160), 380, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const opensUp = window.innerHeight - rect.bottom < menuHeight + 12;
    const preferred = opensUp ? rect.top - menuHeight - 6 : rect.bottom + 6;
    // Меню не должно уезжать за нижний край экрана (важно на телефоне)
    const top = Math.max(8, Math.min(preferred, window.innerHeight - menuHeight - 8));
    setMenuStyle({ top, left, width });
  }, [menuHeight]);

  const setActive = (index) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  const choose = useCallback(
    (option) => {
      activeIndexRef.current = -1;
      setActiveIndex(-1);
      setOpen(false);
      if (String(option.value) !== String(value)) onChange(option.value);
    },
    [onChange, value]
  );

  const openMenu = () => {
    updatePosition();
    setActive(options.findIndex((option) => String(option.value) === String(value)));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();

    const handleMouseDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key === 'Tab') {
        setOpen(false);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = (activeIndexRef.current + step + options.length) % options.length;
        activeIndexRef.current = next;
        setActiveIndex(next);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const option = options[activeIndexRef.current];
        if (option) choose(option);
      }
    };

    // Пока меню открыто, оно едет вместе с кнопкой при скролле и ресайзе
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
  }, [open, options, updatePosition, choose]);

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu();
    }
  };

  const menu = open && menuStyle
    ? createPortal(
        <ul
          className="select__menu"
          role="listbox"
          id={id ? `${id}-listbox` : undefined}
          style={menuStyle}
          ref={menuRef}
        >
          {options.map((option, index) => {
            const isSelected = String(option.value) === String(value);
            return (
              <li key={String(option.value)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    'select__option',
                    isSelected ? 'select__option--selected' : '',
                    index === activeIndex ? 'select__option--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                >
                  {option.dotClass ? <span className={`select__dot ${option.dotClass}`} aria-hidden="true" /> : null}
                  <span className="select__option-label">{option.label}</span>
                  {isSelected ? (
                    <span className="select__check" aria-hidden="true">
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
    <div className={`select ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        className={`select__button${open ? ' select__button--open' : ''}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {selected?.dotClass ? <span className={`select__dot ${selected.dotClass}`} aria-hidden="true" /> : null}
        <span className="select__value">{selected ? selected.label : ''}</span>
        <span className="select__chevron" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {menu}
    </div>
  );
};

export default Select;

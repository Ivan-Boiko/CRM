// AppIcon.jsx — иконка приложения: если пользователь загрузил свою (PNG/SVG),
// показываем её, иначе стандартную (эмодзи или SVG-компонент).
// Если загруженный файл не открылся, тоже возвращаемся к стандартной иконке.
import React, { useEffect, useState } from 'react';
import { useIcons } from '../context/IconContext';

const AppIcon = ({ name, fallback, className = '' }) => {
  const { icons } = useIcons();
  const src = icons[name];
  const [failed, setFailed] = useState(false);

  // Новая картинка — снова пробуем её показать
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span className={`app-icon app-icon--fallback ${className}`.trim()} aria-hidden="true">
        {fallback}
      </span>
    );
  }

  return (
    <img
      className={`app-icon ${className}`.trim()}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
};

export default AppIcon;

import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Описание вкладок: id используется и в имени вкладки, и в id её панели
const TABS = [
  { id: 'active', labelKey: 'tasks.title', panelId: 'tasks-panel-active' },
  { id: 'archive', labelKey: 'archive.title', panelId: 'tasks-panel-archive' },
];

const tabElementId = (id) => `tasks-tab-${id}`;

// Флаг «переключились с клавиатуры/мыши»: после смены панели список вкладок
// перемонтируется, и фокус нужно вернуть на активную вкладку в новом дереве.
let focusAfterSwitch = false;

// Переключатель внутри раздела «Задачи»: активные задачи и архив.
// Клавиатура: ←/→ переключают вкладки, Home/End — первая/последняя.
const TasksTabs = ({ active, onChange }) => {
  const { t } = useLanguage();
  const tabRefs = useRef({});

  useEffect(() => {
    if (!focusAfterSwitch) return;
    focusAfterSwitch = false;
    tabRefs.current[active]?.focus();
  }, [active]);

  // Переключение вкладки: фокус вернёт эффект выше уже в новой панели
  const switchTab = (id) => {
    if (id === active) return;
    focusAfterSwitch = true;
    onChange(id);
  };

  const handleKeyDown = (event, index) => {
    const lastIndex = TABS.length - 1;
    let nextIndex = null;

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = lastIndex;

    if (nextIndex === null) return;
    event.preventDefault();
    switchTab(TABS[nextIndex].id);
  };

  return (
    <div className="tasks-tabs" role="tablist" aria-label={t('tasks.tabsLabel')}>
      {TABS.map((tab, index) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[tab.id] = element;
            }}
            type="button"
            role="tab"
            id={tabElementId(tab.id)}
            aria-selected={isActive}
            // Ссылаемся на панель только у активной вкладки: неактивная панель не смонтирована
            aria-controls={isActive ? tab.panelId : undefined}
            tabIndex={isActive ? 0 : -1}
            className={`tasks-tabs__tab ${isActive ? 'tasks-tabs__tab--active' : ''}`}
            onClick={() => switchTab(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
};

export default TasksTabs;

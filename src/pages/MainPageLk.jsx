import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/mobile/BottomNav';
import TopBar from '../components/TopBar';
import TaskTable from '../components/TaskTable';
import Archive from '../components/Archive';
import { applyTaskFilter } from '../components/TaskFilter';
import Diary from '../components/Diary';
import Analytics from '../components/Analytics';
import Settings from '../components/Settings';
import { apiFetch } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import './MainPageLk.css';

const MainPageLk = () => {
  const [activeItemId, setActiveItemId] = useState(1);
  // Вкладка внутри раздела «Задачи»: активные задачи или архив
  const [tasksTab, setTasksTab] = useState('active');
  const [tasks, setTasks] = useState([]);
  // Подгруппы задач: «Работа», «Личное» и свои
  const [groups, setGroups] = useState([]);
  // Сортировка задач; по умолчанию — по приоритетам
  const [taskFilter, setTaskFilter] = useState('priority');
  const [search, setSearch] = useState('');
  // Задача, которую нужно открыть после клика по уведомлению
  const [focusTaskId, setFocusTaskId] = useState(null);
  const { notify } = useToast();
  const { t } = useLanguage();

  const loadTasks = useCallback(async () => {
    try {
      const data = await apiFetch('/tasks');
      setTasks(data);
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [notify]);

  const loadGroups = useCallback(async () => {
    try {
      const data = await apiFetch('/task-groups');
      setGroups(data);
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [notify]);

  useEffect(() => {
    loadTasks();
    loadGroups();
  }, [loadTasks, loadGroups]);

  // Клик по уведомлению в колокольчике: переходим в задачи и открываем карточку
  const handleOpenTaskFromNotification = useCallback((taskId) => {
    if (!taskId) return;
    setActiveItemId(1);
    setTasksTab('active');
    setFocusTaskId(taskId);
  }, []);

  // В архиве нет фильтра по статусу — сбрасываем его на приоритеты при переходе
  const handleTasksTabChange = (id) => {
    if (id === 'archive' && taskFilter === 'status') setTaskFilter('priority');
    setTasksTab(id);
  };

  // Строка поиска из TopBar: регистронезависимый поиск по нескольким полям
  const query = search.trim().toLowerCase();

  // Активные задачи: поиск из TopBar + сортировка выбранным фильтром
  const visibleTasks = applyTaskFilter(
    tasks
      .filter((task) => task.status !== 'done')
      .filter((task) =>
        query
          ? [task.name, task.description].some(
              (value) => value && String(value).toLowerCase().includes(query)
            )
          : true
      ),
    taskFilter
  );

  return (
    <div className="page-lk">
      <TopBar
        search={search}
        onSearch={setSearch}
        onOpenTask={handleOpenTaskFromNotification}
      />
      <div className="page-lk__layout">
        <Sidebar onMenuClick={setActiveItemId} activeItemId={activeItemId} />
        <div className="page-lk__content">
          <div className="page-lk__wrapper">
            {activeItemId === 1 && (
              <>
                {tasksTab === 'active' ? (
                  <TaskTable
                    tasks={visibleTasks}
                    groups={groups}
                    onGroupsChanged={loadGroups}
                    onRefresh={loadTasks}
                    emptyText={query ? t('common.searchEmpty') : undefined}
                    tab={tasksTab}
                    onTabChange={handleTasksTabChange}
                    filter={taskFilter}
                    onFilterChange={setTaskFilter}
                    focusTaskId={focusTaskId}
                    onFocusHandled={() => setFocusTaskId(null)}
                  />
                ) : (
                  <Archive
                    tasks={tasks}
                    search={search}
                    onRefresh={loadTasks}
                    tab={tasksTab}
                    onTabChange={handleTasksTabChange}
                    filter={taskFilter}
                    onFilterChange={setTaskFilter}
                  />
                )}
              </>
            )}
            {activeItemId === 2 && <Diary search={search} />}
            {activeItemId === 3 && <Analytics tasks={tasks} />}
            {activeItemId === 4 && <Settings />}
          </div>
        </div>
      </div>
      {/* На телефонах меню внизу; на планшетах и десктопе оно скрыто стилями */}
      <BottomNav onMenuClick={setActiveItemId} activeItemId={activeItemId} />
    </div>
  );
};

export default MainPageLk;

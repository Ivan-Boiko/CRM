import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/mobile/BottomNav';
import TopBar from '../components/TopBar';
import TaskTable from '../components/TaskTable';
import Archive from '../components/Archive';
import { applyTaskFilter } from '../components/TaskFilter';
import { buildSubtaskMap, isArchivable } from '../components/taskHierarchy';
import Diary from '../components/Diary';
import Analytics from '../components/Analytics';
import Settings from '../components/Settings';
import { apiFetch } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import './MainPageLk.css';

const MainPageLk = () => {
  // Раздел определяется адресом страницы (вложенные Routes), а не состоянием
  // компонента: так работают ссылки, кнопка «назад» и перезагрузка
  const navigate = useNavigate();

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
  const handleOpenTaskFromNotification = useCallback(
    (taskId) => {
      if (!taskId) return;
      navigate('/main/tasks');
      setFocusTaskId(taskId);
    },
    [navigate]
  );

  // В архиве нет фильтра по статусу — сбрасываем его на приоритеты при переходе
  const handleTasksTabChange = (id) => {
    if (id === 'archive' && taskFilter === 'status') setTaskFilter('priority');
    navigate(id === 'archive' ? '/main/tasks/archive' : '/main/tasks');
  };

  // Подзадачи показываются под основной задачей, а не отдельными строками
  const subtasksByParent = buildSubtaskMap(tasks);
  const topLevelTasks = tasks.filter((task) => !task.parent_id);

  // Активные: не готовые к архиву. Готовая основная задача с открытыми
  // подзадачами остаётся здесь, пока подзадачи не будут выполнены.
  const activeTasks = topLevelTasks.filter(
    (task) => !isArchivable(task, subtasksByParent)
  );
  const archiveTasks = topLevelTasks.filter((task) =>
    isArchivable(task, subtasksByParent)
  );

  // Строка поиска из TopBar: регистронезависимый поиск по нескольким полям
  const query = search.trim().toLowerCase();
  const matchesQuery = (task) =>
    !query ||
    [task.name, task.description].some(
      (value) => value && String(value).toLowerCase().includes(query)
    );

  // Основная задача остаётся в результатах, если совпала её подзадача
  const visibleTasks = applyTaskFilter(
    activeTasks.filter(
      (task) => matchesQuery(task) || (subtasksByParent[task.id] || []).some(matchesQuery)
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
        <Sidebar />
        <div className="page-lk__content">
          <div className="page-lk__wrapper">
            <Routes>
              <Route
                path="tasks"
                element={
                  <TaskTable
                    tasks={visibleTasks}
                    allTasks={activeTasks}
                    subtasksByParent={subtasksByParent}
                    groups={groups}
                    onGroupsChanged={loadGroups}
                    onRefresh={loadTasks}
                    emptyText={query ? t('common.searchEmpty') : undefined}
                    tab="active"
                    onTabChange={handleTasksTabChange}
                    filter={taskFilter}
                    onFilterChange={setTaskFilter}
                    focusTaskId={focusTaskId}
                    onFocusHandled={() => setFocusTaskId(null)}
                  />
                }
              />
              <Route
                path="tasks/archive"
                element={
                  <Archive
                    tasks={archiveTasks}
                    subtasksByParent={subtasksByParent}
                    search={search}
                    onRefresh={loadTasks}
                    tab="archive"
                    onTabChange={handleTasksTabChange}
                    filter={taskFilter}
                    onFilterChange={setTaskFilter}
                  />
                }
              />
              <Route path="diary" element={<Diary search={search} />} />
              <Route path="analytics" element={<Analytics tasks={tasks} />} />
              <Route path="settings" element={<Settings />} />
              {/* /main и неизвестные адреса ведут к задачам */}
              <Route path="*" element={<Navigate to="/main/tasks" replace />} />
            </Routes>
          </div>
        </div>
      </div>
      {/* На телефонах меню внизу; на планшетах и десктопе оно скрыто стилями */}
      <BottomNav />
    </div>
  );
};

export default MainPageLk;

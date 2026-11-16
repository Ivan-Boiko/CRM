import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TaskTable from '../components/TaskTable';
import FilterButtons from '../components/FilterButtons';
import Scripts from '../components/ScriptsDiary';
import Diary from '../components/Diary';
import Clients from '../components/Clients';
import Analytics from '../components/Analytics';
import Settings from '../components/Settings';
import { apiFetch } from '../api';
import { useToast } from '../context/ToastContext';
import './MainPageLk.css';

const MainPageLk = () => {
  const [activeItemId, setActiveItemId] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', dateSort: 'none' });
  const { notify } = useToast();

  const loadTasks = useCallback(async () => {
    try {
      const data = await apiFetch('/tasks');
      setTasks(data);
    } catch (err) {
      notify(err.message, 'error');
    }
  }, [notify]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Фильтрация и сортировка задач по выбранным параметрам
  const visibleTasks = [...tasks]
    .filter((task) => filters.status === 'all' || task.status === filters.status)
    .filter((task) => filters.priority === 'all' || task.priority === filters.priority)
    .sort((a, b) => {
      if (filters.dateSort === 'none') return 0;
      const aTime = a.deadline ? new Date(a.deadline).getTime() : 0;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : 0;
      return filters.dateSort === 'asc' ? aTime - bTime : bTime - aTime;
    });

  return (
    <div className="page-lk">
      <TopBar />
      <div className="page-lk__layout">
        <Sidebar onMenuClick={setActiveItemId} activeItemId={activeItemId} />
        <div className="page-lk__content">
          <div className="page-lk__wrapper">
            {activeItemId === 1 && (
              <>
                <div className="page-lk__filters">
                  <FilterButtons filters={filters} onChange={setFilters} />
                </div>
                <TaskTable tasks={visibleTasks} onRefresh={loadTasks} />
              </>
            )}
            {activeItemId === 2 && <Scripts />}
            {activeItemId === 3 && <Diary />}
            {activeItemId === 4 && <Clients />}
            {activeItemId === 5 && <Analytics tasks={tasks} />}
            {activeItemId === 6 && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPageLk;

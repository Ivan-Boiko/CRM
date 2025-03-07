import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TaskTable from '../components/TaskTable';
import FilterButtons from '../components/FilterButtons';
import Scripts from '../components/ScriptsDiary';
import Diary from '../components/Diary';
import Clients from '../components/Clients'; // Предполагаем, что у вас есть компонент для скриптов
import './MainPageLk.css';

const MainPageLk = () => {
  const [tasks, setTasks] = useState([
    // ... существующие задачи ...
  ]);
  const [activeItemId, setActiveItemId] = useState(1);

  const handleMenuClick = (itemId) => {
    setActiveItemId(itemId);
  };

  return (
    <div className="page-container-lk">
      <TopBar />
      <div className="main-layout-lk">
        <Sidebar onMenuClick={handleMenuClick} activeItemId={activeItemId} />
        <div className="main-content-lk">
          <div className="content-wrapper-lk">
            {activeItemId === 1 && (
              <>
                <div className="filters">
                  <FilterButtons />
                </div>
                <TaskTable tasks={tasks} />
              </>
            )}
            {activeItemId === 2 && <Scripts />}
            {activeItemId === 3 && <Diary />}
            {activeItemId === 4 && <Clients />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPageLk;
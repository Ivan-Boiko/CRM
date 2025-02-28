import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TaskTable from '../components/TaskTable';
import FilterButtons from '../components/FilterButtons';
import Scripts from '../components/Scripts';
import Diary from '../components/Diary'; // Предполагаем, что у вас есть компонент для скриптов
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
    <div className="page-container">
      <TopBar />
      <div className="main-layout">
        <Sidebar onMenuClick={handleMenuClick} activeItemId={activeItemId} />
        <div className="main-content">
          <div className="content-wrapper">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPageLk;
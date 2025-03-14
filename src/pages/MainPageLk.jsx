import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TaskTable from '../components/TaskTable';
import FilterButtons from '../components/FilterButtons';
import Scripts from '../components/ScriptsDiary';
import Diary from '../components/Diary';
import Clients from '../components/Clients';
import Analytics from '../components/Analytics';
import Settings from '../components/Settings';
import './MainPageLk.css';

const MainPageLk = () => {
  const [tasks] = useState([
    // ... существующие задачи ...
  ]);
  const [activeItemId, setActiveItemId] = useState(1);

  const handleMenuClick = (itemId) => {
    setActiveItemId(itemId);
  };

  return (
    <div className="page-lk">
      <TopBar />
      <div className="page-lk__layout">
        <Sidebar onMenuClick={handleMenuClick} activeItemId={activeItemId} />
        <div className="page-lk__content">
          <div className="page-lk__wrapper">
            {activeItemId === 1 && (
              <>
                <div className="page-lk__filters">
                  <FilterButtons />
                </div>
                <TaskTable tasks={tasks} />
              </>
            )}
            {activeItemId === 2 && <Scripts />}
            {activeItemId === 3 && <Diary />}
            {activeItemId === 4 && <Clients />}
            {activeItemId === 5 && <Analytics />}
            {activeItemId === 6 && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPageLk;
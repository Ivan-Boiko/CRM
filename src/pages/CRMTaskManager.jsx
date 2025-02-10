import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Filters from "../components/Filters";
import TaskTable from "../components/TaskTable";
import UrgentTasks from "../components/UrgentTasks";

function CRMTaskManager() {
  return (
      <div className="main-container">
      <Header />
        <div className="content">
        <Sidebar />
          <Filters />
          <TaskTable />
          <UrgentTasks />
        </div>
      </div>

  );
}

export default CRMTaskManager;

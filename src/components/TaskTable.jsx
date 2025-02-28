import React from "react";
import './TaskTable.css';

const tasks = [
  { name: "Задача 1", priority: "high", assigned: "Иван Иванов", deadline: "2023-11-10", status: "todo" },
  { name: "Задача 2", priority: "medium", assigned: "Петр Петров", deadline: "2023-11-12", status: "in-progress" },
  { name: "Задача 3", priority: "low", assigned: "Сергей Сергеев", deadline: "2023-11-15", status: "done" },
  { name: "Задача 4", priority: "high", assigned: "Мария Смирнова", deadline: "2023-11-18", status: "todo" },
  { name: "Задача 5", priority: "medium", assigned: "Анна Иванова", deadline: "2023-11-20", status: "in-progress" },
];

function TaskTable() {
  return (
    <div className="tasks">
      <div className="tasks__container">
        <div className="tasks__table">
          <ul className="tasks__row tasks__row--header">
            <li className="tasks__cell tasks__cell--header">Название задачи</li>
            <li className="tasks__cell tasks__cell--header">Приоритет</li>
            <li className="tasks__cell tasks__cell--header">Ответственный</li>
            <li className="tasks__cell tasks__cell--header">Дедлайн</li>
            <li className="tasks__cell tasks__cell--header">Статус</li>
          </ul>
          
          <ul className="tasks__list">
            {tasks.map((task, index) => (
              <li key={index} className="tasks__row">
                <div className="tasks__cell">{task.name}</div>
                <div className="tasks__cell">
                  <div className={`tasks__priority tasks__priority--${task.priority}`}>
                    {task.priority === 'high' ? 'Красный' : 
                     task.priority === 'medium' ? 'Желтый' : 'Зеленый'}
                  </div>
                </div>
                <div className="tasks__cell">{task.assigned}</div>
                <div className="tasks__cell">{task.deadline}</div>
                <div className="tasks__cell">
                  <div className={`tasks__status tasks__status--${task.status}`}>
                    {task.status}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TaskTable;
import React from "react";

const tasks = [
  { name: "Задача 1", priority: "Красный", assigned: "Иван Иванов", deadline: "2023-11-10", status: "To Do" },
  { name: "Задача 2", priority: "Желтый", assigned: "Петр Петров", deadline: "2023-11-12", status: "In Progress" },
  { name: "Задача 3", priority: "Зеленый", assigned: "Сергей Сергеев", deadline: "2023-11-15", status: "Done" },
  { name: "Задача 4", priority: "Красный", assigned: "Мария Смирнова", deadline: "2023-11-18", status: "To Do" },
  { name: "Задача 5", priority: "Желтый", assigned: "Анна Иванова", deadline: "2023-11-20", status: "In Progress" },
];

function TaskTable() {
  return (
    <table className="task-table">
      <thead>
        <tr>
          <th>Название задачи</th>
          <th>Приоритет</th>
          <th>Ответственный</th>
          <th>Дедлайн</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task, index) => (
          <tr key={index}>
            <td>{task.name}</td>
            <td className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</td>
            <td>{task.assigned}</td>
            <td>{task.deadline}</td>
            <td>{task.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TaskTable;

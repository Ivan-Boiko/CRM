import React, { useState } from "react";
import './common.css';
import './TaskTable.css';

const TaskTable = () => {
  const [tasks, setTasks] = useState([
    { id: 1, name: "Задача 1", priority: "high", assigned: "Иван Иванов", deadline: "2023-11-10", status: "todo" },
    { id: 2, name: "Задача 2", priority: "medium", assigned: "Петр Петров", deadline: "2023-11-12", status: "in-progress" },
    { id: 3, name: "Задача 3", priority: "low", assigned: "Сергей Сергеев", deadline: "2023-11-15", status: "done" },
    { id: 4, name: "Задача 4", priority: "high", assigned: "Мария Смирнова", deadline: "2023-11-18", status: "todo" },
    { id: 5, name: "Задача 5", priority: "medium", assigned: "Анна Иванова", deadline: "2023-11-20", status: "in-progress" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    priority: 'medium',
    assigned: '',
    deadline: '',
    status: 'todo'
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setNewTask({
      ...newTask,
      [id]: value
    });
  };

  const handleAddTask = () => {
    if (newTask.name.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          ...newTask
        }
      ]);
      setNewTask({
        name: '',
        priority: 'medium',
        assigned: '',
        deadline: '',
        status: 'todo'
      });
      setIsModalOpen(false);
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'todo': return 'К выполнению';
      case 'in-progress': return 'В процессе';
      case 'done': return 'Выполнено';
      default: return status;
    }
  };

  return (
    <div className="container-card tasks">
      <div className="component-header">
        <h2 className="component-title">Задачи</h2>
        <button 
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Добавить задачу
        </button>
      </div>

      <div className="tasks__container">
        <div className="tasks__table">
          <div className="tasks__row tasks__row--header">
            <div className="tasks__cell tasks__cell--header">Название задачи</div>
            <div className="tasks__cell tasks__cell--header">Приоритет</div>
            <div className="tasks__cell tasks__cell--header">Ответственный</div>
            <div className="tasks__cell tasks__cell--header">Дедлайн</div>
            <div className="tasks__cell tasks__cell--header">Статус</div>
          </div>
          
          {tasks.map(task => (
            <div key={task.id} className="tasks__row">
              <div className="tasks__cell">{task.name}</div>
              <div className="tasks__cell">
                <div className={`tasks__priority tasks__priority--${task.priority}`}>
                  {getPriorityLabel(task.priority)}
                </div>
              </div>
              <div className="tasks__cell">{task.assigned}</div>
              <div className="tasks__cell">{task.deadline}</div>
              <div className="tasks__cell">
                <div className={`tasks__status tasks__status--${task.status}`}>
                  {getStatusLabel(task.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>Добавить новую задачу</h3>
              <button 
                className="modal__close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label htmlFor="name">Название задачи *</label>
                <input
                  type="text"
                  id="name"
                  value={newTask.name}
                  onChange={handleInputChange}
                  placeholder="Введите название задачи"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Приоритет</label>
                <select
                  id="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                >
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="assigned">Ответственный</label>
                <input
                  type="text"
                  id="assigned"
                  value={newTask.assigned}
                  onChange={handleInputChange}
                  placeholder="Укажите ответственного"
                />
              </div>
              <div className="form-group">
                <label htmlFor="deadline">Дедлайн</label>
                <input
                  type="date"
                  id="deadline"
                  value={newTask.deadline}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Статус</label>
                <select
                  id="status"
                  value={newTask.status}
                  onChange={handleInputChange}
                >
                  <option value="todo">К выполнению</option>
                  <option value="in-progress">В процессе</option>
                  <option value="done">Выполнено</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button 
                className="btn-secondary modal__cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary modal__submit"
                onClick={handleAddTask}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTable;
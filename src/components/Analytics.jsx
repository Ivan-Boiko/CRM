import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './Analytics.css';

const Analytics = () => {
  // Временные данные для демонстрации (в реальном приложении данные будут приходить с сервера)
  const [taskStats, setTaskStats] = useState({
    completedOnTime: 0,
    overdue: 0,
    dueSoon: 0,
    urgent: 0
  });
  
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Имитация загрузки данных
  useEffect(() => {
    // Здесь будет запрос к API для получения реальных данных
    // Временные данные для демонстрации
    setTaskStats({
      completedOnTime: 45,
      overdue: 12,
      dueSoon: 8,
      urgent: 15
    });

    // Данные по дням недели
    setWeeklyData([
      { name: 'Пн', completedOnTime: 5, overdue: 2, dueSoon: 1, urgent: 3 },
      { name: 'Вт', completedOnTime: 7, overdue: 1, dueSoon: 2, urgent: 2 },
      { name: 'Ср', completedOnTime: 8, overdue: 3, dueSoon: 0, urgent: 4 },
      { name: 'Чт', completedOnTime: 10, overdue: 2, dueSoon: 3, urgent: 1 },
      { name: 'Пт', completedOnTime: 12, overdue: 1, dueSoon: 1, urgent: 3 },
      { name: 'Сб', completedOnTime: 2, overdue: 1, dueSoon: 0, urgent: 1 },
      { name: 'Вс', completedOnTime: 1, overdue: 2, dueSoon: 1, urgent: 1 }
    ]);

    // Данные по месяцам
    setMonthlyData([
      { name: 'Янв', completedOnTime: 35, overdue: 10, dueSoon: 5, urgent: 12 },
      { name: 'Фев', completedOnTime: 40, overdue: 8, dueSoon: 7, urgent: 10 },
      { name: 'Мар', completedOnTime: 45, overdue: 12, dueSoon: 8, urgent: 15 },
      { name: 'Апр', completedOnTime: 50, overdue: 7, dueSoon: 10, urgent: 8 },
      { name: 'Май', completedOnTime: 55, overdue: 9, dueSoon: 6, urgent: 11 },
      { name: 'Июн', completedOnTime: 48, overdue: 11, dueSoon: 9, urgent: 14 }
    ]);
  }, []);

  // Данные для круговой диаграммы
  const pieData = [
    { name: 'Выполнено в срок', value: taskStats.completedOnTime, color: '#00A86B' },
    { name: 'Просрочено', value: taskStats.overdue, color: '#FF6B6B' },
    { name: 'Скоро дедлайн', value: taskStats.dueSoon, color: '#FFD166' },
    { name: 'Срочные', value: taskStats.urgent, color: '#F45D48' }
  ];

  // Выбор данных в зависимости от периода
  const chartData = selectedPeriod === 'week' ? weeklyData : monthlyData;

  return (
    <div className="container-card analytics">
      <div className="component-header">
        <h2 className="component-title">Аналитика задач</h2>
        <div className="analytics__period-selector">
          <button 
            className={`btn-secondary ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            Неделя
          </button>
          <button 
            className={`btn-secondary ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Месяц
          </button>
        </div>
      </div>

      <div className="analytics__summary">
        <div className="analytics__summary-item">
          <h3>Всего задач</h3>
          <p className="analytics__summary-value">
            {taskStats.completedOnTime + taskStats.overdue + taskStats.dueSoon + taskStats.urgent}
          </p>
        </div>
        <div className="analytics__summary-item">
          <h3>Выполнено в срок</h3>
          <p className="analytics__summary-value analytics__summary-value--success">
            {taskStats.completedOnTime}
          </p>
        </div>
        <div className="analytics__summary-item">
          <h3>Просрочено</h3>
          <p className="analytics__summary-value analytics__summary-value--danger">
            {taskStats.overdue}
          </p>
        </div>
        <div className="analytics__summary-item">
          <h3>Скоро дедлайн</h3>
          <p className="analytics__summary-value analytics__summary-value--warning">
            {taskStats.dueSoon}
          </p>
        </div>
      </div>

      <div className="analytics__charts">
        <div className="analytics__chart-container">
          <h3 className="analytics__chart-title">Распределение задач</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics__chart-container">
          <h3 className="analytics__chart-title">Динамика задач по {selectedPeriod === 'week' ? 'дням' : 'месяцам'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completedOnTime" name="Выполнено в срок" fill="#00A86B" />
              <Bar dataKey="overdue" name="Просрочено" fill="#FF6B6B" />
              <Bar dataKey="dueSoon" name="Скоро дедлайн" fill="#FFD166" />
              <Bar dataKey="urgent" name="Срочные" fill="#F45D48" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics__chart-container">
          <h3 className="analytics__chart-title">Тренд выполнения задач</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completedOnTime" name="Выполнено в срок" stroke="#00A86B" />
              <Line type="monotone" dataKey="overdue" name="Просрочено" stroke="#FF6B6B" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
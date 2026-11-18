import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './Analytics.css';
import { useLanguage } from '../context/LanguageContext';
import { isCompletedLate } from './taskHierarchy';

const DAY_MS = 24 * 60 * 60 * 1000;

const emptyBucket = (name) => ({
  name,
  completedOnTime: 0,
  overdue: 0,
  dueSoon: 0,
  urgent: 0,
});

// Определяет категорию задачи для аналитики
const categorize = (task, today) => {
  const deadline = task.deadline ? new Date(task.deadline) : null;
  if (deadline) deadline.setHours(0, 0, 0, 0);

  // Закрытая после срока задача — просрочка, а не выполнение в срок
  if (task.status === 'done') return isCompletedLate(task) ? 'overdue' : 'completedOnTime';
  if (deadline && deadline < today) return 'overdue';
  if (deadline && deadline - today <= 3 * DAY_MS) return 'dueSoon';
  if (task.priority === 'high') return 'urgent';
  return null;
};

const Analytics = ({ tasks }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const { t, lang } = useLanguage();
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';

  const { summary, weeklyData, monthlyData } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summaryCounts = { completedOnTime: 0, overdue: 0, dueSoon: 0, urgent: 0 };

    // Неделя: Пн–Вс текущей недели
    const startOfWeek = new Date(today);
    const weekdayIndex = (today.getDay() + 6) % 7; // 0 = понедельник
    startOfWeek.setDate(today.getDate() - weekdayIndex);
    const weekdays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
    const weekly = weekdays.map((day) =>
      emptyBucket(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day))
    );

    // Месяц: последние 6 месяцев
    const months = Array.from({ length: 6 }, (_, i) => {
      return new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    });
    const monthly = months.map((day) =>
      emptyBucket(new Intl.DateTimeFormat(locale, { month: 'short' }).format(day))
    );

    tasks.forEach((task) => {
      const category = categorize(task, today);
      if (!category) return;
      summaryCounts[category] += 1;

      if (task.deadline) {
        const deadline = new Date(task.deadline);
        deadline.setHours(0, 0, 0, 0);

        const weekIndex = weekdays.findIndex((day) => day.getTime() === deadline.getTime());
        if (weekIndex >= 0) weekly[weekIndex][category] += 1;

        const monthIndex = months.findIndex(
          (month) =>
            month.getFullYear() === deadline.getFullYear() && month.getMonth() === deadline.getMonth()
        );
        if (monthIndex >= 0) monthly[monthIndex][category] += 1;
      }
    });

    return { summary: summaryCounts, weeklyData: weekly, monthlyData: monthly };
  }, [tasks, locale]);

  const pieData = [
    { name: t('analytics.completedOnTime'), value: summary.completedOnTime, color: '#00A86B' },
    { name: t('analytics.overdue'), value: summary.overdue, color: '#FF6B6B' },
    { name: t('analytics.dueSoon'), value: summary.dueSoon, color: '#FFD166' },
    { name: t('analytics.urgent'), value: summary.urgent, color: '#F45D48' },
  ];

  const chartData = selectedPeriod === 'week' ? weeklyData : monthlyData;
  const periodLabel = selectedPeriod === 'week' ? t('analytics.periodDays') : t('analytics.periodMonths');

  return (
    <div className="container-card analytics">
      <div className="component-header">
        <h2 className="component-title">{t('analytics.title')}</h2>
        <div className="analytics__period-selector">
          <button
            className={`btn-secondary ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            {t('analytics.week')}
          </button>
          <button
            className={`btn-secondary ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            {t('analytics.month')}
          </button>
        </div>
      </div>

      {tasks.length === 0 && <div className="analytics__empty">{t('analytics.empty')}</div>}

      <div className="analytics__summary">
        <div className="analytics__summary-item">
          <h3>{t('analytics.total')}</h3>
          <p className="analytics__summary-value">{tasks.length}</p>
        </div>
        <div className="analytics__summary-item">
          <h3>{t('analytics.completedOnTime')}</h3>
          <p className="analytics__summary-value analytics__summary-value--success">
            {summary.completedOnTime}
          </p>
        </div>
        <div className="analytics__summary-item">
          <h3>{t('analytics.overdue')}</h3>
          <p className="analytics__summary-value analytics__summary-value--danger">
            {summary.overdue}
          </p>
        </div>
        <div className="analytics__summary-item">
          <h3>{t('analytics.dueSoon')}</h3>
          <p className="analytics__summary-value analytics__summary-value--warning">
            {summary.dueSoon}
          </p>
        </div>
      </div>

      <div className="analytics__charts">
        <div className="analytics__chart-container">
          <h3 className="analytics__chart-title">{t('analytics.distribution')}</h3>
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
          <h3 className="analytics__chart-title">
            {t('analytics.dynamics', { period: periodLabel })}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completedOnTime" name={t('analytics.completedOnTime')} fill="#00A86B" />
              <Bar dataKey="overdue" name={t('analytics.overdue')} fill="#FF6B6B" />
              <Bar dataKey="dueSoon" name={t('analytics.dueSoon')} fill="#FFD166" />
              <Bar dataKey="urgent" name={t('analytics.urgent')} fill="#F45D48" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics__chart-container">
          <h3 className="analytics__chart-title">{t('analytics.trend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="completedOnTime"
                name={t('analytics.completedOnTime')}
                stroke="#00A86B"
              />
              <Line type="monotone" dataKey="overdue" name={t('analytics.overdue')} stroke="#FF6B6B" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

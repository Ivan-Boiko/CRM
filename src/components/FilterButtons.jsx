import React from 'react';
import './FilterButtons.css';
import { useLanguage } from '../context/LanguageContext';

const FilterButtons = ({ filters, onChange }) => {
  const { t } = useLanguage();
  const update = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="filter-buttons">
      <select className="filter-btn" value={filters.status} onChange={update('status')}>
        <option value="all">{t('tasks.filter.status')}</option>
        <option value="todo">{t('status.todo')}</option>
        <option value="in-progress">{t('status.in-progress')}</option>
        <option value="done">{t('status.done')}</option>
      </select>
      <select className="filter-btn" value={filters.priority} onChange={update('priority')}>
        <option value="all">{t('tasks.filter.priority')}</option>
        <option value="high">{t('priority.high')}</option>
        <option value="medium">{t('priority.medium')}</option>
        <option value="low">{t('priority.low')}</option>
      </select>
      <select className="filter-btn" value={filters.dateSort} onChange={update('dateSort')}>
        <option value="none">{t('tasks.filter.dateAll')}</option>
        <option value="asc">{t('tasks.filter.dateAsc')}</option>
        <option value="desc">{t('tasks.filter.dateDesc')}</option>
      </select>
    </div>
  );
};

export default FilterButtons;

import React from 'react';
import './FilterButtons.css';

const FilterButtons = () => {
  return (
    <div className="filter-buttons">
      <button className="filter-btn">
        Статус <span className="arrow">▼</span>
      </button>
      <button className="filter-btn">
        Приоритет <span className="arrow">▼</span>
      </button>
      <button className="filter-btn">
        Дата <span className="arrow">▼</span>
      </button>
    </div>
  );
};

export default FilterButtons;
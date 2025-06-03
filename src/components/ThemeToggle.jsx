import React, { useState, useEffect } from "react";
import './ThemeToggle.css';

const ThemeToggle = ({ onChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Изменение класса body при переключении темы
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
      document.body.dataset.theme = "dark";
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
      document.body.dataset.theme = "";
    }
  }, [isDarkMode]);

  const handleToggle = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (onChange) {
      onChange(nextMode);
    }
  };

  return (
    <div
      className={`theme-toggle ${isDarkMode ? "dark-contaner" : ""}`}
      onClick={handleToggle}
    >
      <div className={`toggle-circle ${isDarkMode ? "dark" : ""}`}>
        {isDarkMode ? "🌙" : "☀️"}
      </div>
    </div>
  );
};

export default ThemeToggle;

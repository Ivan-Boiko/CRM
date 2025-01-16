import React, { useState, useEffect } from "react";
import '../styles/ThemeToggle.css';

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");

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

  return (
    <div className={`theme-toggle ${isDarkMode ? "dark-contaner" : ""}`} onClick={() => setIsDarkMode(!isDarkMode)}>
      <div className={`toggle-circle ${isDarkMode ? "dark" : ""}`}>
        {isDarkMode ? "🌙" : "☀️"}
      </div>
    </div>
  );
};

export default ThemeToggle;

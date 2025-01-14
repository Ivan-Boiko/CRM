import React, { useState, useEffect } from "react";
import '../styles/LanguageToggle.css';

const LanguageToggle = () => {
  const [isRussian, setIsRussian] = useState(localStorage.getItem("language") === "ru");

  // Изменение языка и добавление data-атрибута к body
  useEffect(() => {
    if (isRussian) {
      document.body.dataset.language = "ru";
      localStorage.setItem("language", "ru");
    } else {
      document.body.dataset.language = "en";
      localStorage.setItem("language", "en");
    }
  }, [isRussian]);

  return (
    <div
      className={`language-toggle ${isRussian ? "russian-container" : ""}`}
      onClick={() => setIsRussian(!isRussian)}
    >
      <div className={`toggle-circle_lang ${isRussian ? "russian" : ""}`}>
        {isRussian ? "ru" : "en"}
      </div>
    </div>
  );
};

export default LanguageToggle;


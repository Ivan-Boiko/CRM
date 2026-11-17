// App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import MainPageLk from "./pages/MainPageLk";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./context/ToastContext";
import "./pages/global.css";

// Тема хранится в localStorage: применяем её сразу при старте, иначе после
// перезагрузки на любой странице остаётся светлая тема до захода в настройки
const applyStoredTheme = () => {
  document.body.dataset.theme = localStorage.getItem("theme") === "dark" ? "dark" : "";
};

const App = () => {
  useEffect(() => {
    applyStoredTheme();
  }, []);

  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route
                path="/main"
                element={
                  <ProtectedRoute>
                    <MainPageLk />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
};

export default App;

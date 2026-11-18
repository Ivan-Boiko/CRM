// App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import MainPageLk from "./pages/MainPageLk";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./context/ToastContext";
import { IconProvider } from "./context/IconContext";
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
          <IconProvider>
            <Router>
            <Routes>
              <Route path="/" element={<MainPage />} />
              {/* Ссылки из писем: страницы доступны без входа */}
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              {/* Разделы личного кабинета — отдельные адреса: /main/tasks, /main/diary и т.д. */}
              <Route
                path="/main/*"
                element={
                  <ProtectedRoute>
                    <MainPageLk />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Router>
          </IconProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
};

export default App;

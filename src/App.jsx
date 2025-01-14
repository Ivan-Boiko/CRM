// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import RegistrationModal from "./pages/RegistrationModalPage";
import "./styles/global.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/regist" element={<RegistrationModal />} />
        {/* Здесь можно добавить другие страницы */}
      </Routes>
    </Router>
  );
};

export default App;

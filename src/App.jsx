// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import RegistrationModal from "./pages/RegistrationModalPage";
import MainPageLk from "./pages/MainPageLk";
import "./pages/global.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/regist" element={<RegistrationModal />} />
        <Route path="/main" element={<MainPageLk />} />
      </Routes>
    </Router>
  );
};

export default App;
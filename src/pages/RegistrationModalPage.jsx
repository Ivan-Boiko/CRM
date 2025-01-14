import React from "react";
import RegistrationForm from "../components/RegistrationForm";
import Header from "../components/Header";

const RegistrationModalPage = () => {
  const handleFormSubmit = (data) => {
    console.log("Данные регистрации:", data);
    alert("Регистрация успешна!");
    // Здесь можно выполнить логику отправки данных на сервер
  };

  return (
    <div>
      <Header />
      <div className="registration-container">
        <RegistrationForm onSubmit={handleFormSubmit} />
      </div>
    </div>
  );
};

export default RegistrationModalPage;

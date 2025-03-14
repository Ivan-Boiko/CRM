import React, { useState } from "react";
import "./RegistrationForm.css";

const RegistrationForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Имя обязательно.";
    if (!formData.email.trim()) newErrors.email = "Email обязателен.";
    if (!formData.password.trim()) newErrors.password = "Пароль обязателен.";
    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = "Подтверждение пароля обязательно.";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Пароли не совпадают.";

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="registration-form">
      <h2 className="registration-form__title">Регистрация</h2>
      <form className="registration-form__form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Имя"
            className="registration-form__input"
          />
          {errors.name && <div className="error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="registration-form__input"
          />
          {errors.email && <div className="error">{errors.email}</div>}
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Пароль"
            className="registration-form__input"
          />
          {errors.password && <div className="error">{errors.password}</div>}
        </div>
        <div className="form-group">
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Подтвердите пароль"
            className="registration-form__input"
          />
          {errors.confirmPassword && (
            <div className="error">{errors.confirmPassword}</div>
          )}
        </div>
        <button type="submit" className="submit-btn">
          Зарегистрироваться
        </button>
      </form>
      <button className="close-btn" onClick={onCancel}>
        Отмена
      </button>
    </div>
  );
};

export default RegistrationForm;
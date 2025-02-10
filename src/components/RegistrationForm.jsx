import React, { useState } from "react";
import "./RegistrationForm.css";

const RegistrationForm = ({ onSubmit }) => {
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
    <form className="registration-form" onSubmit={handleSubmit}>
      <h2 className="form-group__header">Регистрация</h2>
      <ul className="registration-form__list">
      <li className="form-group">
        <label>Имя</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </li>

      <li className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </li>

      <li className="form-group">
        <label>Пароль</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </li>

      <li className="form-group">
        <label>Подтвердите пароль</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        {errors.confirmPassword && (
          <span className="error">{errors.confirmPassword}</span>
        )}
      </li>

      <button type="submit" className="submit-btn">
        Зарегистрироваться
      </button>
      </ul>
      
    </form>
  );
};

export default RegistrationForm;

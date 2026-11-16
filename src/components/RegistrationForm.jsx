import React, { useState } from "react";
import "./RegistrationForm.css";
import { useLanguage } from "../context/LanguageContext";

const RegistrationForm = ({ onSubmit, onCancel }) => {
  const { t } = useLanguage();
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
    if (!formData.name.trim()) newErrors.name = t('register.nameRequired');
    if (!formData.email.trim()) newErrors.email = t('register.emailRequired');
    if (!formData.password.trim()) newErrors.password = t('register.passwordRequired');
    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = t('register.confirmRequired');
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t('register.mismatch');

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
      <h2 className="registration-form__title">{t('register.title')}</h2>
      <form className="registration-form__form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('register.name')}
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
            placeholder={t('register.email')}
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
            placeholder={t('register.password')}
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
            placeholder={t('register.confirm')}
            className="registration-form__input"
          />
          {errors.confirmPassword && (
            <div className="error">{errors.confirmPassword}</div>
          )}
        </div>
        <button type="submit" className="submit-btn">
          {t('register.submit')}
        </button>
      </form>
      <button className="close-btn" onClick={onCancel}>
        {t('common.cancel')}
      </button>
    </div>
  );
};

export default RegistrationForm;

// LoginForm.jsx
import React from 'react';
import './LoginForm.css';
import { useNavigate } from 'react-router-dom';

function LoginForm({ onLogin}) {
    const navigate = useNavigate();

    const onRegister = () => {
      navigate("/regist"); // Переход на страницу регистрации
    };

    return (
        <div className="login-form">
            <h2>CRM</h2>
            <form onSubmit={onLogin}>
                <input type="text" placeholder="Логин" required />
                <input type="password" placeholder="Пароль" required />
                <button type="submit">Войти</button>
            </form>
            <button className="register-btn button_glob" onClick={onRegister}>Регистрация</button>
        </div>
    );
}

export default LoginForm;
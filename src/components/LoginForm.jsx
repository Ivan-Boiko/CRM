// LoginForm.jsx
import React from 'react';
import './LoginForm.css';

function LoginForm({ onLogin, onRegister }) {
    const handleRegisterClick = (e) => {
        e.preventDefault(); // Prevent any default behavior
        onRegister(); // Call the register function once
    };

    return (
        <div className="login">
            <h2 className="login__title">CRM</h2>
            <form className="login__form" onSubmit={onLogin}>
                <input className="login__input" type="text" placeholder="Логин" required />
                <input className="login__input" type="password" placeholder="Пароль" required />
                <button className="login__button" type="submit">Войти</button>
            </form>
            <button className="login__register-button" onClick={handleRegisterClick}>Регистрация</button>
        </div>
    );
}

export default LoginForm;
// LoginForm.jsx
import React from 'react';
import '../styles/LoginForm.css';

function LoginForm({ onLogin, onRegister }) {
    return (
        <div className="login-form">
            <h2>CRM</h2>
            <form onSubmit={onLogin}>
                <input type="text" placeholder="Логин" required />
                <input type="password" placeholder="Пароль" required />
                <button type="submit">Войти</button>
            </form>
            <button className="register-btn" onClick={onRegister}>Регистрация</button>
        </div>
    );
}

export default LoginForm;
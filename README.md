# CRM

Личная CRM-панель: React-клиент (Create React App) + Express API с локальной базой SQLite.
Документ ведётся как «карта проекта» — что где лежит, как работает, какие есть баги и что делать дальше.
Этот README — главный источник истины о состоянии проекта, ориентируйся на него.

---

## 1. Стек технологий

| Слой | Технологии |
| --- | --- |
| Фронтенд | React 18, react-router-dom v6, recharts (графики), CSS-файлы по компонентам |
| Бэкенд | Node.js (ESM, `type: module`), Express 4, `cors`, `bcryptjs`, `jsonwebtoken` |
| БД | **SQLite** через `better-sqlite3` (синхронный API, файл `server/crm.db`) |
| Аутентификация | JWT (срок 7 дней), токен в `Authorization: Bearer`, хранение в `localStorage` |
| Шаблон | Create React App (`react-scripts` 5) |

---

## 2. Структура проекта

```
CRM/
├── public/                 # статика CRA (favicon, logo192/512, manifest)
├── server/                 # Бэкенд
│   ├── server.js           # Express-приложение и все API-роуты (auth + CRUD)
│   ├── database.js         # better-sqlite3 + initDb + миграции addColumnIfMissing
│   ├── crm.db              # файл БД SQLite (создаётся автоматически, в .gitignore)
│   └── package.json        # Зависимости сервера (type: module)
├── src/
│   ├── App.jsx             # Провайдеры (Language > Toast > Auth) + Роутер
│   ├── index.js            # Точка входа React
│   ├── api.js              # Единый хелпер запросов (BASE_URL, токен, обработка ошибок)
│   ├── i18n.js             # Словари переводов ru/en
│   ├── context/
│   │   ├── AuthContext.jsx        # user/loading, login/register/logout/updateUser
│   │   ├── LanguageContext.jsx    # lang, setLang, t(key, params), formatDate
│   │   └── ToastContext.jsx       # notify(message, type) — уведомления
│   ├── pages/
│   │   ├── MainPage.jsx    # Страница входа + модалка регистрации (если user -> /main)
│   │   ├── MainPageLk.jsx  # ЛК: загрузка задач, фильтры, рендер разделов
│   │   └── global.css      # CSS-переменные, темы (data-theme), шрифты, reset
│   └── components/         # Все UI-компоненты (см. ниже)
└── package.json            # Зависимости клиента
```

### Компоненты

| Компонент | Назначение | Состояние |
| --- | --- | --- |
| `LoginForm` | Форма входа | Вызывает `useAuth().login` |
| `RegistrationForm` | Форма регистрации с валидацией | Вызывает `useAuth().register` |
| `RegistrationModal` | Модальное окно-обёртка регистрации | — |
| `Header` | Верхняя панель страницы входа (тема/язык) | — |
| `Sidebar` | Меню разделов ЛК (6 пунктов) + аватар пользователя | Аватар: картинка или инициалы |
| `TopBar` | Верхняя панель ЛК (лого, поиск, аватар, выход) | Аватар: картинка или инициалы |
| `TaskTable` | Таблица задач + модалки добавления/редактирования/просмотра. Строка кликабельна — открывает просмотр с описанием. | Полный CRUD через API, мобильные карточки |
| `FilterButtons` | Фильтры (Статус/Приоритет/Сортировка по дате) | Работают, клиентская фильтрация |
| `ScriptsDiary` (`Scripts`) | Список скриптов + CRUD | Полный CRUD через API |
| `Diary` | Дневник записей | Полный CRUD через API |
| `Clients` | Список клиентов + inline-редактирование | Полный CRUD через API |
| `Analytics` | Графики (круговая/столбцы/линия) | Данные из реальных задач |
| `Settings` | Настройки: профиль (аватар), тема, язык | Загрузка/смена/удаление аватара |
| `ThemeToggle` | Переключатель светлая/тёмная тема | Работает через `data-theme` на body |
| `LanguageToggle` | Переключатель ru/en | Меняет язык + переводит интерфейс |
| `ProtectedRoute` | Защищает `/main` — без user редирект на `/` | — |

---

## 3. Запуск

### Бэкенд

```bash
cd server
npm install
npm start        # порт 5000 (или PORT из env)
```

База данных — локальный файл SQLite `server/crm.db`, создаётся автоматически. Никаких внешних сервисов (Postgres/Docker) не требуется.
При старте `initDb()` создаёт таблицы, если их нет, и применяет миграции (добавляет недостающие колонки).

### Фронтенд

```bash
npm install
npm start        # CRA, по умолчанию http://localhost:3000
```

> Прокси в `package.json` не настроен — клиент обращается к API по абсолютному адресу
> `http://localhost:5000` (можно переопределить через `REACT_APP_API_URL`).
> CORS на сервере открыт всем (dev-режим).

---

## 4. Поток данных

```
React (apiFetch -> http://localhost:5000/api/...)
        │  (заголовок Authorization: Bearer <token>, если есть)
        ▼
Express (server.js) -> middleware auth() проверяет JWT
        │
        ▼
SQLite (database.js: db.prepare(...).run/all/get)
```

Запросы идут через единый хелпер [api.js](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/api.js) — `apiFetch(path, {method, body})`.
Он подставляет токен из `localStorage`, разбирает JSON и бросает `Error` с полем `status` при неуспехе.

### API-эндпоинты

| Метод | Путь | Описание |
| --- | --- | --- |
| POST | `/api/register` | Регистрация: `name, email, password` → `{token, user}` |
| POST | `/api/login` | Вход: `email, password` → `{token, user}` |
| GET | `/api/me` | Профиль текущего пользователя (требует токен) |
| PUT | `/api/me` | Обновление профиля: `name` и/или `avatar` (требует токен) |
| GET/POST/PUT/DELETE | `/api/tasks[/:id]` | Задачи (CRUD, только свои `user_id`) |
| GET/POST/PUT/DELETE | `/api/scripts[/:id]` | Скрипты |
| GET/POST/PUT/DELETE | `/api/diary[/:id]` | Дневник |
| GET/POST/PUT/DELETE | `/api/clients[/:id]` | Клиенты |

Все CRUD-эндпоинты генерируются универсальной фабрикой `crud(route, table, fields, requiredField)` в [server.js](file:///c:/Users/Ivan/Desktop/CRM/CRM/server/server.js).
Каждая запись привязана к `user_id` — пользователь видит и меняет только свои данные.

### Схема БД (SQLite)

```sql
users    (id PK, name, email UNIQUE, password, avatar)
tasks    (id PK, user_id FK, name, description, priority, assigned, deadline, status)
diary    (id PK, user_id FK, text, date)
scripts  (id PK, user_id FK, title, description, content, date)
clients  (id PK, user_id FK, name, description, phone, email)
```

Миграции реализованы через `addColumnIfMissing(table, column, definition)` в [database.js](file:///c:/Users/Ivan/Desktop/CRM/CRM/server/database.js) — безопасно добавляет колонки в существующие таблицы. Добавлялись: `tasks.description`, `users.avatar`.

---

## 5. Ключевые особенности реализации

### Аутентификация
- Пароли хешируются через `bcryptjs` (соль 10).
- При входе/регистрации выдаётся JWT (`{id, email}`, срок 7 дней), секрет — `JWT_SECRET` env или `dev-secret-change-me`.
- Токен хранится в `localStorage` под ключом `token`, отправляется в заголовке `Authorization`.
- Middleware `auth` раскладывает токен в `req.user`; неавторизованным возвращает 401.
- При загрузке приложения `AuthContext` проверяет токен через `/api/me`.

### Контексты (React Context API)
- **AuthContext** — `user`, `loading`, `login(email,password)`, `register(name,email,password)`, `logout()`, `updateUser(data)`.
- **LanguageContext** — `lang`, `setLang`, `t(key, params)` (подстановка `{param}`), `formatDate(value)`. Язык сохраняется в `localStorage` и в `document.body.dataset.language`.
- **ToastContext** — `notify(message, type)` (типы `info`/`success`/`error`, автоскрытие 4с).

### Темы и i18n
- Тема: `data-theme="dark"` на `<body>`, CSS-переменные в [global.css](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/pages/global.css).
- Язык: словари `ru`/`en` в [i18n.js](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/i18n.js). Если ключа нет — возвращается сам ключ.

### Аватары
- Хранится как data URL (JPEG) в колонке `users.avatar`.
- При загрузке в Настройках изображение обрезается по центру и ресайзится до 128×128 через canvas (см. `resizeImage` в [Settings.jsx](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/components/Settings.jsx)).
- В `Sidebar` и `TopBar` показывается картинка; если аватара нет — кружок с инициалом имени.

### Выпадающие списки
- Стилизованы через класс `.form-select` (в [common.css](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/components/common.css)) — кастомная SVG-стрелка, зелёная рамка при hover/focus, поддержка тёмной темы.
- Фильтры в [FilterButtons.css](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/components/FilterButtons.css) стилизованы аналогично.

### Таблица задач ([TaskTable.jsx](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/components/TaskTable.jsx))
- **Описание задачи не выводится в таблице** — только название, приоритет, ответственный, дедлайн, статус, действия.
- **Строка кликабельна** — клик (или Enter/Пробел на фокусе) открывает модалку просмотра задачи с полной информацией, включая описание.
- **Кнопки «Редактировать»/«Удалить»** имеют `stopPropagation`, чтобы не открывать просмотр.
- **Модалка просмотра** показывает название в заголовке, описание в блоке (если есть), сетку из приоритета/статуса/ответственного/дедлайна. Из неё можно перейти к редактированию.
- **Мобильная версия** (`max-width: 768px`): заголовок таблицы скрывается, каждая строка превращается в карточку с подписями полей слева.

### Поля ввода (глобальные стили)
- Все `input`/`textarea`/`select` во всём приложении получают современный вид из [global.css](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/pages/global.css) — скругление 8px, единые отступы, зелёная рамка и свечение при фокусе, поддержка тёмной темы.
- Поля с компонентными классами (`login__input`, `search-input`, `script-card__form-textarea` и т.д.) сохраняют специфику (ширину, моноширинный шрифт для кода), но рамку/скругление/фокус наследуют общие.

---

## 6. Известные проблемы и баги

### Серьёзные
1. **CORS открыт всем** (`cors()` без опций) — допустимо для dev, небезопасно для продакшена.
2. **JWT-секрет по умолчанию** `dev-secret-change-me` — в проде обязательно задать через env.
3. **Поиск в TopBar** — только визуальное поле, не подключено к данным.
4. **Аватар как data URL в БД** — на больших объёмах раздувает базу; в проде лучше хранить файлы отдельно.

### Мелкие / UI
5. **`npm audit` фронтенда** показывает уязвимости в зависимостях CRA (в основном `react-scripts` и его транзитивные). Для dev не критично, но стоит обновить при возможности.
6. **Watchpack ошибки** `EINVAL: lstat 'C:\System Volume Information'` и т.п. при старте CRA — безвредны, связаны с индексацией диска.
7. **`better-sqlite3`** компилирует нативный модуль — требует совместимую версию Node (проверено на Node 22).

---

## 7. План дальнейших доработок

1. **Поиск** — подключить поле в TopBar к фильтрации задач/клиентов.
2. **Сортировка и пагинация** для таблиц (сейчас только фильтрация на клиенте).
3. **Уведомления** — сделать реальные (сейчас просто иконка 🔔).
4. **Экспорт данных** — резервное копирование SQLite-базы или экспорт в CSV/JSON.
5. **Редактирование имени/email** пользователя в Настройках (сейчас только аватар).
6. **Валидация форм** на фронтенде (email, обязательные поля).
7. **Ограничение размера аватара** — сейчас ресайз до 128×128, но нет проверки исходного размера файла.

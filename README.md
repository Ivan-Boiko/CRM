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
├── public/                 # статика: icons/ (знак CRM в PNG и SVG), manifest.json
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
| `Sidebar` | Меню разделов ЛК (4 пункта) + аватар пользователя | Аватар: картинка или инициалы |
| `TopBar` | Верхняя панель ЛК (лого, поиск, аватар, выход) | Аватар: картинка или инициалы |
| `TaskTable` | Таблица задач + модалки добавления/редактирования/просмотра. Строка кликабельна — открывает просмотр с описанием. | Полный CRUD через API, мобильные карточки |
| `TaskFilter` | Селектор «Фильтровать по:» (дата/приоритет/статус) | Сортировка на клиенте, по умолчанию по приоритетам |
| `Diary` | Дневник записей | Полный CRUD через API |
| `Archive` | Вкладка «Архив» внутри раздела задач: комментарии, возврат в работу, удаление | Без редактирования |
| `TasksTabs` | Переключатель «Задачи / Архив» в шапке раздела | — |
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

> В разработке адрес API берётся из `.env.development` (`REACT_APP_API_URL=http://localhost:5000`).
> В production клиент и API живут на одном домене: Express отдаёт и `build/`, и `/api/*`,
> поэтому адрес API не задаётся. CORS пускает только источники из `CORS_ORIGINS`
> (без переменной — только `localhost:3000` для разработки).

### Деплой на сервер

Docker + Caddy с автоматическим HTTPS, база на томе, бэкапы — пошагово в [docs/DEPLOY.md](docs/DEPLOY.md).
Коротко: заполнить `.env` по `.env.example` и выполнить `docker compose up -d --build`.

### Подключение Telegram (необязательно)

Бот не нужен для работы CRM: без токена блок в настройках показывает «Бот не настроен на сервере», остальное работает как раньше.

1. В Telegram откройте [@BotFather](https://t.me/BotFather), выполните `/newbot`, задайте имя и получите токен вида `123456:AA...`.
2. Добавьте его в `.env` на сервере: `TELEGRAM_BOT_TOKEN=...` (пустая строка есть в `.env.example`) и перезапустите: `docker compose up -d`.
3. В CRM откройте «Настройки → Уведомления и Telegram → Привязать Telegram», перейдите по ссылке и нажмите Start. Статус обновится сам в течение пары секунд.
4. «Проверить» отправляет сообщение в чат, «Отключить» (или команда `/stop` в боте) убирает привязку.

Один бот обслуживает все аккаунты инстанса: у каждого пользователя свой `chat_id`. Токен хранится только в `.env`, сервер опрашивает Telegram long polling'ом — публичный вебхук не нужен. Код привязки одноразовый и живёт 15 минут.

### Проверка с телефона по локальной сети

1. Узнать IPv4 компьютера в его Wi-Fi: `ipconfig` (Windows) или `ip addr` / `ifconfig` (macOS, Linux). Пример: `192.168.31.136`.
2. Быстрый вариант — один порт без CORS: собрать клиент (`npm run build`), затем в папке `server`
   `PORT=5000 npm start` и открыть на телефоне `http://192.168.31.136:5000`. Express отдаёт и интерфейс, и API.
3. Вариант с живой перезагрузкой: `HOST=0.0.0.0 PORT=3000 npm start` для клиента,
   в `.env.development.local` (не коммитится) указать `REACT_APP_API_URL=http://192.168.31.136:5000`,
   перезапустить dev-сервер и открыть `http://192.168.31.136:3000`.
   В development CORS разрешает запросы из частных сетей (`10.*`, `192.168.*`, `172.16–31.*`).
4. Если страница не грузится — разрешить Node.js в брандмауэре для частной сети и проверить, что телефон в той же Wi-Fi.
5. Установка на домашний экран: Safari — «Поделиться → На экран «Домой»», Chrome — «⋮ → Установить приложение».

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
| GET | `/api/telegram/status` | Статус бота: `{ configured, linked, username, botUsername }` |
| POST | `/api/telegram/link` | Одноразовый код и ссылка на бота; 503, если `TELEGRAM_BOT_TOKEN` не задан |
| DELETE | `/api/telegram/link` | Отвязать Telegram |
| POST | `/api/telegram/test` | Проверочное сообщение в привязанный чат |
| GET/POST/PUT/DELETE | `/api/tasks[/:id]` | Задачи (CRUD, только свои `user_id`) |
| GET/POST/PUT/DELETE | `/api/diary[/:id]` | Дневник |

Все CRUD-эндпоинты генерируются универсальной фабрикой `crud(route, table, fields, requiredField)` в [server.js](file:///c:/Users/Ivan/Desktop/CRM/CRM/server/server.js).
Каждая запись привязана к `user_id` — пользователь видит и меняет только свои данные.

### Схема БД (SQLite)

```sql
users    (id PK, name, email UNIQUE, password, avatar, telegram_chat_id, telegram_username, telegram_link_code, telegram_link_expires, telegram_linked_at)
tasks    (id PK, user_id FK, name, description, priority, deadline, status, comment, group_id FK)
task_groups (id PK, user_id FK, name, created_at) — подгруппы задач
task_comments (id PK, task_id FK, text, kind: comment|return, created_at)
diary    (id PK, user_id FK, text, date)
```

Миграции реализованы через `addColumnIfMissing(table, column, definition)` в [database.js](file:///c:/Users/Ivan/Desktop/CRM/CRM/server/database.js) — безопасно добавляет колонки в существующие таблицы. Добавлялись: `tasks.description`, `tasks.comment`, `users.avatar`.

Таблицы `clients` и `scripts` остались в уже существующих базах (данные не удалялись), но код их больше не использует.

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
- Селектор фильтра (`.task-filter__select` в [TaskTable.css](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/components/TaskTable.css)) использует тот же `.form-select`.

### Таблица задач ([TaskTable.jsx](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/components/TaskTable.jsx))
- **Описание задачи не выводится в таблице** — только название, приоритет, ответственный, дедлайн и статус; действия («изменить»/«удалить») — иконками в правом верхнем углу строки.
- **Строка кликабельна** — клик (или Enter/Пробел на фокусе) открывает модалку просмотра задачи с полной информацией, включая описание.
- **Иконки «карандаш»/«крестик»** имеют `stopPropagation`, чтобы не открывать просмотр; удаление всегда спрашивает подтверждение.
- **Модалка просмотра** показывает название в заголовке, описание в блоке (если есть), сетку из приоритета/статуса/ответственного/дедлайна. Из неё можно перейти к редактированию.
- **Мобильная версия** (`max-width: 768px`): заголовок таблицы скрывается, каждая строка превращается в карточку с подписями полей слева.
- **Выполненные задачи** уходят во вкладку «Архив» внутри раздела «Задачи» (переключатель в шапке): там их нельзя редактировать — только вернуть в работу, удалить (с подтверждением в модальном окне) или оставить комментарий. Комментариев у задачи может быть сколько угодно, они хранятся в таблице `task_comments`.
- **Статус задачи** меняется прямо в таблице — выпадающим меню в колонке «Статус», без открытия редактирования.
- **Подгруппы задач** — в форме задачи выбирается «Работа», «Личное» или своя подгруппа: её можно создать тут же, а ненужную — удалить (задачи останутся в «Без подгруппы»). Список разбит на сворачиваемые секции по подгруппам. Кнопка «Добавить задачу» — под списком, по центру.
- **Возврат из архива** — кнопка со стрелкой рядом с крестиком: открывается окно с обязательной причиной возврата, задача получает статус «В процессе» и возвращается в «Задачи», а причина сохраняется комментарием с `kind = 'return'` и выделяется в окне просмотра задачи.

### Поля ввода (глобальные стили)
- Все `input`/`textarea`/`select` во всём приложении получают современный вид из [global.css](file:///c:/Users/Ivan/Desktop/CRM/CRM/src/pages/global.css) — скругление 8px, единые отступы, зелёная рамка и свечение при фокусе, поддержка тёмной темы.
- Поля с компонентными классами (`login__input`, `search-input`, `script-card__form-textarea` и т.д.) сохраняют специфику (ширину, моноширинный шрифт для кода), но рамку/скругление/фокус наследуют общие.

---

## 6. Известные проблемы и баги

### Серьёзные
1. **CORS открыт всем** (`cors()` без опций) — допустимо для dev, небезопасно для продакшена.
2. **JWT-секрет по умолчанию** `dev-secret-change-me` — в проде обязательно задать через env.
3. **Аватар как data URL в БД** — на больших объёмах раздувает базу; в проде лучше хранить файлы отдельно.

### Мелкие / UI
4. **`npm audit` фронтенда** показывает уязвимости в зависимостях CRA (в основном `react-scripts` и его транзитивные). Для dev не критично, но стоит обновить при возможности.
5. **Watchpack ошибки** `EINVAL: lstat 'C:\System Volume Information'` и т.п. при старте CRA — безвредны, связаны с индексацией диска.
6. **`better-sqlite3`** компилирует нативный модуль — требует совместимую версию Node (проверено на Node 22).

---

## 7. План дальнейших доработок

1. **Пагинация** для таблиц (сейчас все записи загружаются и сортируются на клиенте).
2. **Уведомления** — сделать реальные (сейчас просто иконка 🔔).
3. **Экспорт данных** — резервное копирование SQLite-базы или экспорт в CSV/JSON.
4. **Редактирование имени/email** пользователя в Настройках (сейчас только аватар).
5. **Валидация форм** на фронтенде (email, обязательные поля).
6. **Ограничение размера аватара** — сейчас ресайз до 128×128, но нет проверки исходного размера файла.

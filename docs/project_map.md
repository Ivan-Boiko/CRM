# Карта проекта CRM

## Общие сведения
- **Технологии**: React 18, React Router 6, Recharts, CRA (create-react-app)
- **Бэкенд**: Node.js/Express; локально — `localhost:5000` (`REACT_APP_API_URL` из `.env.development`), в production тот же Express отдаёт собранный React и API на одном домене (адрес API не задаётся)
- **Деплой**: Docker + docker-compose + Caddy — см. `docs/DEPLOY.md`
- **Стили**: Inline CSS, файлы `.css` рядом с компонентами
- **Комментарии**: ru, код: en

## Структура `src/`

### index.js — точка входа (рендер App) + polyfills (React 18) + Intl

### api.js — единый слой API
- `apiFetch(path, options)` — fetch запрос к `${BASE_URL}/api${path}`
- Bearer токен из localStorage, Content-Type: application/json
- Единый throw Error { status } при неуспехе

### App.jsx — корневой компонент
- EnvProviders (react-scripts 5)
- Router с двумя роутами: `/*` (MainPage — логин) и `/main` (ProtectedRoute + MainPageLk)
- Context провайдеры: AuthProvider, IconProvider, LanguageProvider, ToastProvider

### context/ — глобальные состояния
- AuthContext.jsx — user, login, register, logout, updateUser
- LanguageContext.jsx — lang, t(key, params), formatDate
- ToastContext.jsx — notify(message, type), dismiss(id)
- IconContext.jsx — свои иконки пользователя: icons, localOnly, reload, saveIcon, removeIcon (PNG/SVG в базе; при старом сервере — временно в localStorage с автопереносом)
- Toast.css — стили для toast-уведомлений

### pages/
- MainPage.jsx — главная страница (форма логина + модал регистрации)
- MainPage.css — стили MainPage
- MainPageLk.jsx — личный кабинет (Sidebar + контент)
- MainPageLk.css — стили MainPageLk
- ResetPassword.jsx — страница `/reset?token=...` по ссылке из письма: новый пароль и подтверждение
- ConfirmEmail.jsx — страница `/confirm-email?token=...`: подтверждение смены email паролем от аккаунта
- global.css — глобальные стили (body, шрифты, reset) — **ключевой файл!**

### components/ — компоненты и их CSS

#### Layout
- Header.jsx / Header.css — верхняя панель (поиск, logout, theme toggle)
- TopBar.jsx / TopBar.css — панель личного кабинета (заголовок, компактные переключатели темы и языка рядом с колокольчиком, поиск, аватар, выход)
- NotificationsBell.jsx / NotificationsBell.css — колокольчик: бейдж непрочитанных, панель напоминаний (на телефоне — лист снизу), переход к задаче
- Sidebar.jsx / Sidebar.css — боковое меню: ссылки на `/main/tasks`, `/main/diary`, `/main/analytics`, `/main/settings`; активный пункт определяет `NavLink`

#### Forms
- LoginForm.jsx / LoginForm.css — форма входа (email + password); переключатели темы и языка стоят в строке заголовка карточки на одном уровне с «CRM»: тема слева, язык справа
- RegistrationModal.jsx / RegistrationModal.css — модал регистрации
- RegistrationForm.jsx / RegistrationForm.css — форма регистрации (внутри модала)

#### CRUD / Контент
- TaskTable.jsx / TaskTable.css — таблица задач (CRUD, фильтрация, сортировка, иконки действий, подгруппы со сворачиванием): шапка колонок внутри каждой раскрытой группы, подзадачи под основной задачей (список сворачивается кнопкой со счётчиком), бейдж «Ждёт подзадачи», перетаскивание удержанием: на другую задачу — подзадачей к её основной, на заголовок группы или вне списка задач — самостоятельной; визуальная иерархия — группы-карточки с зелёной шапкой, Lato в таблице, отдельные стили задачи/подзадачи и подписей полей, тёмная тема
- taskHierarchy.js — общие правила: карта подзадач, наличие открытых подзадач, попадание задачи в архив
- Archive.jsx / Archive.css — архив выполненных задач (список комментариев, добавление нового, возврат в работу с причиной, удаление)
- TasksTabs.jsx — переключатель «Задачи / Архив» в шапке раздела задач
- TaskFilter.jsx — селектор «Фильтровать по:» и `applyTaskFilter` (сортировка по дате/приоритету/статусу)
- Select.jsx / Select.css — общий выпадающий список вместо нативных select (кнопка в стиле поля, меню-карточка в портале, клавиатура, тёмная тема)
- DatePicker.jsx / DatePicker.css — календарь дедлайна вместо нативного `input type="date"` (карточка в портале, навигация по месяцам, «Сегодня»/«Удалить», выбор времени в том же календаре, прошедшие дни недоступны)
- StatusSelect.jsx / StatusSelect.css — выпадающий список статуса в строке таблицы (кнопка-бейдж + меню в портале, без нативного select)
- Diary.jsx / Diary.css — дневник записей: тема записи (`topic`), текст, дата; кнопки — системные `.btn-primary` / `.btn-secondary`
- Analytics.jsx / Analytics.css — аналитика (Recharts)
- Settings.jsx / Settings.css — настройки (профиль, смена пароля, смена email с подтверждением по ссылке, иконки, необязательное подключение Telegram: статус, ссылка на бота, проверка и отключение)
- IconSettings.jsx — блок «Иконки»: список всех иконок, замена файлом PNG/SVG (до 64 КБ) и сброс к стандартной

#### Мобильные компоненты
- mobile/BottomNav.jsx / mobile/BottomNav.css — нижняя таб-панель на телефонах (≤768 px) вместо сайдбара: Задачи / Дневник / Аналитика / Настройки, фиксирована внизу, с safe-area

#### Shared
- ProtectedRoute.jsx — wrapper для роута, требует user в auth
- AppIcon.jsx — выводит свою иконку пользователя (data URL) или стандартную (эмодзи/SVG): name, fallback
- ActionIcons.jsx — стандартные SVG-иконки действий: карандаш, крестик, стрелка возврата
- ConfirmDialog.jsx — модальное подтверждение действия (заменило `window.confirm`)
- common.css — общие CSS классы для компонентов
- LanguageToggle.jsx / LanguageToggle.css — переключатель языка (ru/en)
- ThemeToggle.jsx / ThemeToggle.css — переключатель темы (светлая/тёмная)

## Статика
- public/icons/icon.svg, icon-maskable.svg — исходники знака CRM (зелёный #00A86B, белая надпись)
- public/icons/icon-192.png, icon-512.png — иконки `any` для манифеста
- public/icons/icon-maskable-512.png — maskable-иконка (надпись в безопасной зоне 80%)
- public/icons/apple-touch-icon.png — 180×180 для домашнего экрана iOS
- public/icons/favicon-32.png — иконка вкладки (буква C)

## Роуты
| Путь | Компонент | Требуется auth |
|------|-----------|---------------|
| / | MainPage | ❌ |
| /reset?token=... | ResetPassword | ❌ |
| /confirm-email?token=... | ConfirmEmail | ❌ |
| /main | → /main/tasks (redirect) | ✅ |
| /main/tasks | TaskTable | ✅ |
| /main/tasks/archive | Archive | ✅ |
| /main/diary | Diary | ✅ |
| /main/analytics | Analytics | ✅ |
| /main/settings | Settings | ✅ |
| * | → / (redirect) | - |

## API Endpoints
- GET /api/health — проверка живости (docker healthcheck)
- GET /api/config — публичные настройки для клиента: `{ registrationEnabled }` (переменная `ALLOW_REGISTRATION`)
- POST /api/login — авторизация
- POST /api/register — регистрация (403, если `ALLOW_REGISTRATION=false`)
- GET /api/config — также отдаёт `mailEnabled`: настроена ли отправка писем
- GET /api/icons — свои иконки пользователя `{ icons: { key: dataUrl } }`
- PUT /api/icons/:key — замена иконки `{ dataUrl }`: только PNG/SVG, до 64 КБ, ключ из списка (nav.tasks, nav.diary, nav.analytics, nav.settings, bell, action.edit, action.delete, action.return)
- DELETE /api/icons/:key — сброс иконки к стандартной
- GET /api/me — профиль текущего пользователя
- PUT /api/me — обновление профиля: `name`, `avatar`, `password` + `currentPassword` (смена пароля); `email` не меняется сразу — создаётся заявка и письмо на новый адрес, ответ содержит `pendingEmail` и новый `token`
- GET /api/auth/email-change?token=... — проверка ссылки из письма, `{ email }` — какой адрес подтверждаем
- POST /api/auth/confirm-email — `{ token, password }`: проверка пароля, смена email и одноразовый токен
- POST /api/auth/forgot-password — письмо со ссылкой `/reset?token=...` (токен на час, одноразовый); 503 без `RESEND_API_KEY`, всегда `{ sent: true }` для существующего и несуществующего адреса
- POST /api/auth/reset-password — новый пароль по токену из письма `{ token, password }`
- Письма отправляет `server/mailer.js` через HTTPS API Resend (без SDK); срок и одноразовость токенов — таблица `password_resets`
- GET /api/telegram/status — `{ configured, linked, username, botUsername }`
- POST /api/telegram/link — одноразовый код и ссылка на бота `{ code, deeplink, expiresAt, botUsername }`; 503, если `TELEGRAM_BOT_TOKEN` не задан
- DELETE /api/telegram/link — отвязать Telegram
- POST /api/telegram/test — проверочное сообщение в привязанный чат; 400 без привязки, 502 при ошибке отправки
- Привязка Telegram живёт в `server/telegram.js` (getMe, long polling getUpdates, `/start <код>`, `/stop`, sendMessage)
- GET /api/notifications — `{ items, unread }`, до 50 последних; параметр `tz` сохраняется в `users.timezone`
- POST /api/notifications/:id/read — отметить прочитанным
- POST /api/notifications/read-all — прочитать все
- Напоминания за 6 часов и за час до дедлайна создаёт `server/notifications.js` по тику раз в минуту
- GET/POST/PUT/DELETE /api/tasks — задачи (GET отдаёт задачи вместе с массивом `comments`); `parent_id` делает задачу подзадачей (один уровень), при удалении основной подзадачи становятся отдельными
- GET /api/task-groups — подгруппы задач («Работа», «Личное» создаются автоматически)
- POST /api/task-groups — создать подгруппу ({ name })
- DELETE /api/task-groups/:id — удалить подгруппу; её задачи остаются и получают `group_id = NULL`
- POST /api/tasks/:id/comments — добавить комментарий к задаче; `kind: 'return'` помечает причину возврата из архива
- PUT /api/tasks/:id — смена статуса (в т.ч. прямо из таблицы и при возврате в работу)
- GET/POST/PUT/DELETE /api/diary — дневник
- (полный список — в server/server.js)

## Деплой
- `Dockerfile` — многоступенчатая сборка: React-клиент → зависимости сервера → рантайм `node:20-slim`, пользователь `node`, том `/data` для базы, healthcheck
- `docker-compose.yml` — сервисы `app` (Express, порт 5000 только внутри сети) и `caddy` (80/443, HTTPS); тома `crm-data`, `caddy-data`, `caddy-config`
- `deploy/Caddyfile` — домен из `DOMAIN`, автосертификат Let's Encrypt, HSTS и security-заголовки, реверс-прокси на `app:5000`
- `.env.example` — шаблон переменных (`DOMAIN`, `JWT_SECRET`, `CORS_ORIGINS`, `DB_PATH`, `CLIENT_BUILD_DIR`, необязательные `TELEGRAM_BOT_TOKEN`, `APP_ORIGIN`, `RESEND_API_KEY`, `MAIL_FROM`); `.env` в git не попадает
- `.dockerignore` — контекст сборки без node_modules, build и локальной базы
- `server/scripts/backup-db.js` — онлайн-бэкап SQLite через `db.backup()` с ротацией (`BACKUP_DIR`, `BACKUP_KEEP`)
- `server/env.js` — локальный запуск читает корневой `.env` (кроме `DB_PATH` и `CLIENT_BUILD_DIR`, они заданы для Docker); внутри Docker переменные приходят из compose
- `docs/DEPLOY.md` — пошаговая инструкция: сервер, `.env`, запуск, перенос базы, cron-бэкапы, обновления, разбор проблем
# Карта проекта CRM

## Общие сведения
- **Технологии**: React 18, React Router 6, Recharts, CRA (create-react-app)
- **Бэкенд**: Node.js/Express на localhost:5000 (API URL через env переменную `REACT_APP_API_URL`)
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
- Context провайдеры: AuthProvider, LanguageProvider, ToastProvider

### context/ — глобальные состояния
- AuthContext.jsx — user, login, register, logout, updateUser
- LanguageContext.jsx — lang, t(key, params), formatDate
- ToastContext.jsx — notify(message, type), dismiss(id)
- Toast.css — стили для toast-уведомлений

### pages/
- MainPage.jsx — главная страница (форма логина + модал регистрации)
- MainPage.css — стили MainPage
- MainPageLk.jsx — личный кабинет (Sidebar + контент)
- MainPageLk.css — стили MainPageLk
- global.css — глобальные стили (body, шрифты, reset) — **ключевой файл!**

### components/ — компоненты и их CSS

#### Layout
- Header.jsx / Header.css — верхняя панель (поиск, logout, theme toggle)
- TopBar.jsx / TopBar.css — панель личного кабинета (заголовок, theme toggle, language toggle)
- Sidebar.jsx / Sidebar.css — боковое меню (навигация по разделам 1-4: задачи, дневник, аналитика, настройки)

#### Forms
- LoginForm.jsx / LoginForm.css — форма входа (email + password)
- RegistrationModal.jsx / RegistrationModal.css — модал регистрации
- RegistrationForm.jsx / RegistrationForm.css — форма регистрации (внутри модала)

#### CRUD / Контент
- TaskTable.jsx / TaskTable.css — таблица задач (CRUD, фильтрация, сортировка, иконки действий, подгруппы со сворачиванием)
- Archive.jsx / Archive.css — архив выполненных задач (список комментариев, добавление нового, возврат в работу с причиной, удаление)
- TasksTabs.jsx — переключатель «Задачи / Архив» в шапке раздела задач
- TaskFilter.jsx — селектор «Фильтровать по:» и `applyTaskFilter` (сортировка по дате/приоритету/статусу)
- Select.jsx / Select.css — общий выпадающий список вместо нативных select (кнопка в стиле поля, меню-карточка в портале, клавиатура, тёмная тема)
- DatePicker.jsx / DatePicker.css — календарь дедлайна вместо нативного `input type="date"` (карточка в портале, навигация по месяцам, «Сегодня»/«Удалить»)
- StatusSelect.jsx / StatusSelect.css — выпадающий список статуса в строке таблицы (кнопка-бейдж + меню в портале, без нативного select)
- Diary.jsx / Diary.css — дневник записей
- Analytics.jsx / Analytics.css — аналитика (Recharts)
- Settings.jsx / Settings.css — настройки (профиль, тема, язык)

#### Shared
- ProtectedRoute.jsx — wrapper для роута, требует user в auth
- ActionIcons.jsx — SVG-иконки действий: карандаш, крестик, стрелка возврата
- ConfirmDialog.jsx — модальное подтверждение действия (заменило `window.confirm`)
- common.css — общие CSS классы для компонентов
- LanguageToggle.jsx / LanguageToggle.css — переключатель языка (ru/en)
- ThemeToggle.jsx / ThemeToggle.css — переключатель темы (светлая/тёмная)

## Роуты
| Путь | Компонент | Требуется auth |
|------|-----------|---------------|
| / | MainPage | ❌ |
| /main | MainPageLk | ✅ |
| * | → / (redirect) | - |

## API Endpoints
- POST /api/login — авторизация
- POST /api/register — регистрация
- GET /api/me — профиль текущего пользователя
- PUT /api/me — обновление профиля
- GET/POST/PUT/DELETE /api/tasks — задачи (GET отдаёт задачи вместе с массивом `comments`)
- GET /api/task-groups — подгруппы задач («Работа», «Личное» создаются автоматически)
- POST /api/task-groups — создать подгруппу ({ name })
- DELETE /api/task-groups/:id — удалить подгруппу; её задачи остаются и получают `group_id = NULL`
- POST /api/tasks/:id/comments — добавить комментарий к задаче; `kind: 'return'` помечает причину возврата из архива
- PUT /api/tasks/:id — смена статуса (в т.ч. прямо из таблицы и при возврате в работу)
- GET/POST/PUT/DELETE /api/diary — дневник
- (полный список — в server/server.js)
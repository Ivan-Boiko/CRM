# Деплой CRM на VPS

Один сервер, docker compose, два контейнера:

- `app` — Express, который отдаёт API `/api/*` и собранный React (`build/`);
- `caddy` — HTTPS-прокси с автоматическим сертификатом Let's Encrypt.

База SQLite лежит на томе `crm-data` (`/data/crm.db`), поэтому пересборки образа её не трогают.

## Что понадобится

- VPS с Ubuntu 22.04/24.04, минимум 1 CPU / 1 GB RAM / 10 GB диска;
- домен и A-запись `crm.example.com` → IP сервера (AAAA-запись, если есть IPv6);
- открытые порты 80 и 443 (22 для SSH);
- репозиторий на GitHub (уже запушен).

## 1. Подготовка сервера

```bash
ssh root@<IP-сервера>

apt update && apt upgrade -y
apt install -y git curl ufw

# Docker + compose plugin
curl -fsSL https://get.docker.com | sh

# Файрвол: только SSH и веб
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 2. Код и настройки

```bash
mkdir -p /srv && cd /srv
git clone https://github.com/Ivan-Boiko/CRM.git crm
cd crm

cp .env.example .env
nano .env
```

В `.env` обязательно заполнить:

| Переменная | Значение |
| --- | --- |
| `DOMAIN` | ваш домен, например `crm.example.com` |
| `JWT_SECRET` | вывод команды `openssl rand -hex 32` |
| `CORS_ORIGINS` | `https://crm.example.com` — тот же домен, что в `DOMAIN` |
| `TELEGRAM_BOT_TOKEN` | необязательно: токен личного бота от @BotFather (`/newbot`); без него подключение Telegram в настройках выключено |

`DB_PATH=/data/crm.db` и `CLIENT_BUILD_DIR=/app/build` уже указаны верно для контейнера — менять не нужно.

## 3. Запуск

```bash
docker compose up -d --build
docker compose ps          # оба сервиса должны быть running/healthy
docker compose logs -f caddy
```

Caddy выпустит сертификат при первом обращении к домену (несколько секунд). Открывайте `https://crm.example.com` — там уже интерфейс, на `/api/health` отвечает `{"status":"ok"}`.

Проверка API изнутри сервера:

```bash
curl -s https://crm.example.com/api/health
```

Сразу после этого откройте сайт, зарегистрируйте свой аккаунт и закройте регистрацию: `ALLOW_REGISTRATION=false` в `.env`, затем `docker compose up -d app`.

## 4. Перенос существующей базы (по желанию)

Если нужно забрать данные с локальной машины:

```bash
# локально (Windows: путь вида C:\Users\Ivan\Desktop\CRM\CRM\server\crm.db)
scp server/crm.db root@<IP>:/tmp/crm.db

# на сервере
cd /srv/crm
docker compose stop app
docker compose run --rm -v /tmp:/import app sh -c \
  'cp /import/crm.db /data/crm.db && rm -f /data/crm.db-wal /data/crm.db-shm'
docker compose start app
```

Новый сервер регистрации не требует: пользователи и пароли уже в базе.

## 5. Бэкапы

Скрипт делает онлайн-копию базы (приложение можно не останавливать) и хранит последние 14 файлов в `/data/backups` внутри тома.

```bash
docker compose exec -T app node server/scripts/backup-db.js
```

Ежедневный запуск в 03:00 — `crontab -e`:

```cron
0 3 * * * cd /srv/crm && docker compose exec -T app node server/scripts/backup-db.js >> /var/log/crm-backup.log 2>&1
```

Скачать копию к себе:

```bash
docker compose exec -T app sh -c 'ls -1 /data/backups | tail -1'   # имя последнего файла
docker compose cp app:/data/backups/<имя>.db ./crm-backup.db
```

Восстановление: остановить `app`, положить файл как `/data/crm.db`, удалить `crm.db-wal` и `crm.db-shm`, запустить `app`.

## 6. Обновление версии

```bash
cd /srv/crm
git pull
docker compose up -d --build
docker compose logs -f app
```

Миграции схемы (`server/database.js`) применяются при старте сами.

## 7. Полезные команды

```bash
docker compose ps                     # статусы
docker compose logs -f app            # логи приложения
docker compose logs -f caddy          # логи HTTPS и запросов
docker compose restart app            # перезапуск
docker compose down                   # остановить (том с базой остаётся)
docker compose down -v                # ОСТОРОЖНО: удалит базу и сертификаты
```

## Если что-то не работает

| Симптом | Что проверить |
| --- | --- |
| `502` от Caddy | `docker compose ps`, логи `app`; контейнер должен быть `healthy` |
| Нет сертификата | A-запись домена на IP сервера, порты 80/443 открыты, `docker compose logs caddy` |
| Браузер пишет про CORS | `CORS_ORIGINS` в `.env` совпадает с доменом из адресной строки (со `https://`, без слэша); в логах `app` при старте есть предупреждение, если переменная пустая |
| `429` при входе | Сработала защита от перебора: подождать `LOGIN_WINDOW_MINUTES` минут или поднять `LOGIN_MAX_ATTEMPTS` / `LOGIN_MAX_ATTEMPTS_IP` |
| Приложение не стартует | `JWT_SECRET` пустой — в production сервер специально падает |
| `EACCES` на базе | том создан от root: `docker compose run --rm app chown -R node:node /data` |
| Пустая страница | сборка клиента не попала в образ: `docker compose build --no-cache app` |

## Про безопасность

- Регистрация открыта всем, кто знает адрес. После создания своего аккаунта поставьте в `.env` `ALLOW_REGISTRATION=false` и перезапустите приложение: `docker compose up -d app`. Кнопка «Регистрация» исчезнет со страницы входа, а `POST /api/register` будет отвечать `403`.
- Смена `JWT_SECRET` разлогинивает все устройства.
- Подбор пароля ограничен двумя счётчиками за окно `LOGIN_WINDOW_MINUTES` (по умолчанию 15 минут): на пару «IP + email» — `LOGIN_MAX_ATTEMPTS` (5), и на один IP целиком — `LOGIN_MAX_ATTEMPTS_IP` (20), чтобы нельзя было перебирать сразу много аккаунтов. После лимита вход отвечает `429` с заголовком `Retry-After`. Успешный вход сбрасывает счётчик аккаунта, но не общий счётчик адреса. Счётчики живут в памяти процесса и очищаются при перезапуске — это защита от перебора, а не блокировка аккаунта.
- Если в production не задан `CORS_ORIGINS`, сервер громко предупреждает в логах при старте: запросы с сайта получат `403`. Смотреть `docker compose logs app`.
- HTTPS-сертификат Caddy продлевает сам, ничего делать не нужно.
- Наружу открыты только 80 и 443: порт приложения 5000 доступен лишь внутри docker-сети.

## Локальная разработка (как было)

```bash
# сервер (в окружении этого проекта PORT=0, поэтому порт задаём явно)
cd server && PORT=5000 npm start

# клиент
PORT=3000 BROWSER=none npm start
```

Клиент в разработке ходит на `http://localhost:5000` — адрес задан в `.env.development`.

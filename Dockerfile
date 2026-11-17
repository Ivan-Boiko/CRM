# Образ CRM: React собирается отдельно, Express отдаёт готовую сборку и API.
# better-sqlite3 — нативный модуль, поэтому зависимости сервера ставятся
# в отдельном слое с компилятором, а в финальный образ попадают уже готовыми.

# 1. Сборка клиента
FROM node:20-bookworm-slim AS client
WORKDIR /client
COPY package.json package-lock.json ./
RUN npm ci
COPY public ./public
COPY src ./src
# Адрес API не задаём: в production клиент ходит на свой же домен
RUN npm run build

# 2. Зависимости сервера (тут может понадобиться компиляция better-sqlite3)
FROM node:20-bookworm-slim AS server-deps
WORKDIR /server
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# 3. Рабочий образ
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=5000 \
    DB_PATH=/data/crm.db \
    CLIENT_BUILD_DIR=/app/build
WORKDIR /app

COPY --from=server-deps /server/node_modules ./server/node_modules
COPY server ./server
COPY --from=client /client/build ./build

RUN mkdir -p /data && chown -R node:node /app /data
USER node

EXPOSE 5000

# Проверка живости для docker healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server/server.js"]

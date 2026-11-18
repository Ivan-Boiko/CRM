// Загрузка корневого .env для локального запуска (node server.js).
// В Docker переменные приходят из docker-compose (env_file + environment),
// поэтому там файл не читается: пути деплоя из него локальному серверу не подходят.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const inDocker = fs.existsSync('/.dockerenv') || process.env.NODE_ENV === 'production';

if (!inDocker) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  // Эти значения в .env заданы для контейнера: /data и /app/build.
  // Локально сервер должен использовать server/crm.db и ../build.
  const dockerOnly = new Set(['DB_PATH', 'CLIENT_BUILD_DIR']);

  for (const file of [path.join(root, '.env'), path.join(root, 'server', '.env')]) {
    if (!fs.existsSync(file)) continue;

    for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq <= 0) continue;

      const key = line.slice(0, eq).trim();
      if (!key || dockerOnly.has(key) || process.env[key] !== undefined) continue;

      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      } else {
        // Комментарий после значения: KEY=value # пояснение
        const comment = value.indexOf(' #');
        if (comment !== -1) value = value.slice(0, comment).trim();
      }

      process.env[key] = value;
    }
  }
}

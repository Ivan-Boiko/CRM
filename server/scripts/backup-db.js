// Бэкап базы CRM без остановки приложения.
// better-sqlite3 делает онлайн-копию вместе с WAL, поэтому сервер гасить не нужно.
//
// Запуск:
//   node server/scripts/backup-db.js
//   docker compose exec -T app node server/scripts/backup-db.js
// Настройки: DB_PATH (по умолчанию server/crm.db рядом со скриптом),
// BACKUP_DIR (по умолчанию папка backups рядом с базой), BACKUP_KEEP (по умолчанию 14).
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'crm.db');
const backupDir = process.env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups');
const keep = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);

if (!fs.existsSync(dbPath)) {
  console.error(`База не найдена: ${dbPath}`);
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });

// Имя файла: crm-2026-11-17T03-00-00.db — сортируется по времени
const stamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
const target = path.join(backupDir, `crm-${stamp}.db`);

const db = new Database(dbPath, { readonly: true });
try {
  await db.backup(target);
} catch (err) {
  console.error(`Не удалось сделать бэкап: ${err.message}`);
  process.exit(1);
} finally {
  db.close();
}

// Оставляем только последние keep копий
const backups = fs
  .readdirSync(backupDir)
  .filter((name) => /^crm-.*\.db$/.test(name))
  .sort();

backups
  .slice(0, Math.max(0, backups.length - keep))
  .forEach((name) => fs.rmSync(path.join(backupDir, name), { force: true }));

console.log(`${new Date().toISOString()} бэкап готов: ${target} (храним последние ${keep})`);

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/postgres',
});

export async function initDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      priority TEXT,
      assigned TEXT,
      deadline DATE,
      status TEXT
    )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS diary (
      id SERIAL PRIMARY KEY,
      text TEXT,
      date TIMESTAMP
    )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS scripts (
      id SERIAL PRIMARY KEY,
      title TEXT,
      description TEXT,
      content TEXT,
      date TIMESTAMP
    )`);
}

export default pool;

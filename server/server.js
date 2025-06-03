import express from 'express';
import cors from 'cors';
import pool, { initDb } from './database.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// initialize database
await initDb();

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, password]
    );
    res.json({ message: 'User registered' });
  } catch (err) {
    if (err && err.code === '23505') {
      res.status(409).json({ message: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (rows.length) {
      res.json({ message: 'Login success' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { name, priority, assigned, deadline, status } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Missing task name' });
  }
  try {
    await pool.query(
      'INSERT INTO tasks (name, priority, assigned, deadline, status) VALUES ($1, $2, $3, $4, $5)',
      [name, priority, assigned, deadline, status]
    );
    res.json({ message: 'Task added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/diary', async (req, res) => {
  const { text, date } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Missing text' });
  }
  try {
    await pool.query(
      'INSERT INTO diary (text, date) VALUES ($1, $2)',
      [text, date || new Date()]
    );
    res.json({ message: 'Entry added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/scripts', async (req, res) => {
  const { title, description, content, date } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Missing title' });
  }
  try {
    await pool.query(
      'INSERT INTO scripts (title, description, content, date) VALUES ($1, $2, $3, $4)',
      [title, description, content, date || new Date()]
    );
    res.json({ message: 'Script added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

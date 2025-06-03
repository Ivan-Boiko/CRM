import express from 'express';
import cors from 'cors';
import dbPromise, { initDb } from './database.js';

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
    const db = await dbPromise;
    await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    res.json({ message: 'User registered' });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT') {
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
    const db = await dbPromise;
    const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (user) {
      res.json({ message: 'Login success' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

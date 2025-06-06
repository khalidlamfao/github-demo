require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

io.on('connection', socket => {
  if (socket.user?.id) {
    socket.join(`user:${socket.user.id}`);
    console.log('client connected', socket.user.username);
  }
});

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO users(username,password) VALUES($1,$2) RETURNING id',
      [username, hash]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
  res.json({ token });
});

app.get('/api/tasks', auth, async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks WHERE user_id=$1', [req.user.id]);
  res.json(result.rows);
});

app.post('/api/tasks', auth, async (req, res) => {
  const result = await pool.query(
    'INSERT INTO tasks(user_id,title,completed) VALUES($1,$2,false) RETURNING *',
    [req.user.id, req.body.title]
  );
  const task = result.rows[0];
  io.to(`user:${req.user.id}`).emit('task_created', task);
  res.json(task);
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  const result = await pool.query(
    'UPDATE tasks SET title=$1, completed=$2 WHERE id=$3 AND user_id=$4 RETURNING *',
    [req.body.title, req.body.completed, req.params.id, req.user.id]
  );
  const task = result.rows[0];
  io.to(`user:${req.user.id}`).emit('task_updated', task);
  res.json(task);
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2', [
    req.params.id,
    req.user.id
  ]);
  io.to(`user:${req.user.id}`).emit('task_deleted', { id: +req.params.id });
  res.sendStatus(204);
});

// ✅ Serve frontend from /client
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));


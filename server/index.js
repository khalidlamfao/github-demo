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

// Authenticate sockets using the JWT sent during the connection handshake and
// associate each socket with a user-specific room. Clients should pass their
// token via the `auth` option when calling `io()` on the frontend.
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
  // Each socket joins a room based on the authenticated user's id so that
  // task events can be targeted to the proper recipient only.
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
    const result = await pool.query('INSERT INTO users(username,password) VALUES($1,$2) RETURNING id', [username, hash]);
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: 'User exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  if (!(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
  res.json({ token });
});

app.get('/api/tasks', auth, async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks WHERE user_id=$1 ORDER BY id', [req.user.id]);
  res.json(result.rows);
});

app.post('/api/tasks', auth, async (req, res) => {
  const { title } = req.body;
  const result = await pool.query('INSERT INTO tasks(user_id,title,completed) VALUES($1,$2,false) RETURNING *', [req.user.id, title]);
  const task = result.rows[0];
  // Emit to the room of the task owner so only their sockets receive the event
  io.to(`user:${task.user_id}`).emit('task_created', task);
  res.json(task);
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  const { title, completed } = req.body;
  const result = await pool.query('UPDATE tasks SET title=$1, completed=$2 WHERE id=$3 AND user_id=$4 RETURNING *', [title, completed, req.params.id, req.user.id]);
  const task = result.rows[0];
  // Send update to sockets associated with the task owner
  io.to(`user:${task.user_id}`).emit('task_updated', task);
  res.json(task);
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  // Notify the task owner only
  io.to(`user:${req.user.id}`).emit('task_deleted', { id: Number(req.params.id) });
  res.json({});
});

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Server listening on', PORT));

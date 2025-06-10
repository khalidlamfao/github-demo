const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;

const connectionString = `postgresql://${username}:${password}@${host}:5432/${dbName}`;


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all for testing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

app.use(cors());
app.use(bodyParser.json());

const SECRET = 'secret';
let users = [];
let tasks = [];
let socketsByUser = {};

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.sendStatus(400);
  users.push({ username, password });
  res.sendStatus(201);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.sendStatus(401);
  const token = jwt.sign({ username }, SECRET);
  res.json({ token });
});

app.get('/api/tasks', authenticate, (req, res) => {
  const userTasks = tasks.filter(t => t.user === req.user.username);
  res.json(userTasks);
});

app.post('/api/tasks', authenticate, (req, res) => {
  const task = {
    id: Date.now().toString(),
    title: req.body.title,
    completed: false,
    user: req.user.username,
  };
  tasks.push(task);
  res.status(201).json(task);
  broadcastToUser(req.user.username, 'task_created', task);
});

app.put('/api/tasks/:id', authenticate, (req, res) => {
  const task = tasks.find(t => t.id === req.params.id && t.user === req.user.username);
  if (!task) return res.sendStatus(404);
  task.title = req.body.title;
  task.completed = req.body.completed;
  res.json(task);
  broadcastToUser(req.user.username, 'task_updated', task);
});

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id && t.user === req.user.username);
  if (index === -1) return res.sendStatus(404);
  const deleted = tasks.splice(index, 1)[0];
  res.sendStatus(204);
  broadcastToUser(req.user.username, 'task_deleted', { id: deleted.id });
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('authenticate', ({ token }) => {
    try {
      const user = jwt.verify(token, SECRET);
      socket.username = user.username;
      socketsByUser[user.username] = socket;
      console.log(`User ${user.username} authenticated on socket ${socket.id}`);
    } catch (err) {
      console.error('Socket auth failed:', err.message);
      socket.disconnect();
    }
  });
});

function broadcastToUser(username, event, data) {
  const socket = socketsByUser[username];
  if (socket) {
    socket.emit(event, data);
  }
}

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});


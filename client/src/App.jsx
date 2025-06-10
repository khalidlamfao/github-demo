import { useState } from 'react';
import TaskApp from './TaskApp';
import Login from './Login';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  return loggedIn ? <TaskApp /> : <Login onLogin={() => setLoggedIn(true)} />;
}

